# Architecture

This document is the developer's tour of how WhatsApp Second Brain is put together: the runtime contexts, the extension lifecycle, the data model, and how everything communicates.

## Runtime contexts

```
┌─────────────────────────────────────────────────────────────┐
│  WhatsApp Web page (web.whatsapp.com)                        │
│                                                              │
│   ┌───────────────────────┐      ┌─────────────────────────┐ │
│   │  CONTENT SCRIPT        │      │  SIDEBAR (Shadow DOM)   │ │
│   │  - injects host node   │─────▶│  React app, style-      │ │
│   │  - ChatDetector        │ store│  isolated               │ │
│   │  - reminder/stats sync │◀─────│  Notes/Todos/Reminders  │ │
│   │  - owns IndexedDB       │      │  /Settings              │ │
│   └───────────┬───────────┘      └───────────┬─────────────┘ │
└───────────────┼──────────────────────────────┼───────────────┘
                │ chrome.runtime / chrome.storage │ Dexie (IndexedDB, page origin)
                ▼                                ▼
        ┌───────────────────┐          ┌──────────────────────┐
        │ BACKGROUND (SW)   │          │ IndexedDB "secondBrain"│
        │ - alarms          │          │ chats/notes/todos/    │
        │ - notifications   │          │ reminders             │
        └───────────────────┘          └──────────────────────┘
        ┌───────────────────┐
        │ POPUP (React)     │  reads chrome.storage stats; messages the tab
        └───────────────────┘
```

### Why Shadow DOM (not an iframe)

The sidebar renders into a `shadowRoot` attached to a host element injected into the page. Compiled Tailwind CSS is injected as a `<style>` into the shadow root. This gives **complete style isolation** in both directions — our styles can't leak into WhatsApp, and WhatsApp's CSS can't bleed into us — without an iframe's messaging overhead.

Because the sidebar is mounted by the content script, **they share one JS context**. That's why the content↔sidebar "bridge" is just a Zustand store (`state/chat.store.ts`) rather than message passing.

## Extension lifecycle

1. **Install / update** — the background worker seeds a periodic reminder-poll alarm and processes any due reminders.
2. **Page load** (`document_idle`) — the content script injects the host + shadow root, mounts the React sidebar (collapsed by default), and starts the `ChatDetector`, reminder sync, and stats sync.
3. **Chat change** — the `ChatDetector` (a debounced `MutationObserver` scoped to `#app`, plus a safety poll) resolves the open conversation and emits a normalized `ChatContext`. The content script updates the chat store, upserts the `chats` row, and notifies the background.
4. **Data change** — Dexie `liveQuery` subscriptions mirror pending reminders and storage stats into `chrome.storage.local`.
5. **Reminder due** — a `chrome.alarms` alarm wakes the background worker, which reads pending reminders from `chrome.storage.local` and fires a `chrome.notifications` notification. This works even if the sidebar is collapsed or the tab is closed.
6. **Popup** — reads mirrored stats from `chrome.storage.local`; "Open sidebar" focuses the WhatsApp tab and sends `OPEN_SIDEBAR`.
7. **Context invalidation** — if the extension is reloaded, a content-script watchdog detects the orphaned context and tears down (stops the detector and sync subscriptions, removes listeners) so no `chrome.*` call throws.

## Chat detection

WhatsApp's DOM is obfuscated and changes often, so detection is a **prioritized strategy chain** (`content/chat-detector/strategies.ts`):

1. Parse the stable chat **JID** from a message element's `data-id`.
2. Fallback: a `name:`-prefixed id derived from the conversation header title.

Detection is deliberately **sticky**: the active chat is only cleared when the conversation pane (`#main`) is genuinely gone. A transient resolution miss during a re-render keeps the current chat, preventing flicker. The decision is a pure, unit-tested function (`decideChatChange`).

## Data model

IndexedDB database `secondBrain` (Dexie), one table per entity. All timestamps are epoch-ms numbers.

| Table | Key | Fields |
|---|---|---|
| `chats` | `chatId` | `chatName`, `lastOpened`, `createdAt` |
| `notes` | `id` | `chatId`, `content` (markdown), `createdAt`, `updatedAt` |
| `todos` | `id` | `chatId`, `title`, `description`, `priority`, `completed`, `createdAt`, `updatedAt` |
| `reminders` | `id` | `chatId`, `title`, `datetime`, `completed`, `createdAt` |

The domain types live in `types/models.ts`; the runtime validation schemas mirror them in `storage/schemas.ts` (annotated `z.ZodType<Model>` so a schema/model drift fails the build).

### Storage layers (SOLID)

```
UI / hooks → services (business logic) → repositories (IRepository<T>) → Dexie
```

- `storage/repository.types.ts` — the `IRepository` / `IChatScopedRepository` contracts.
- `storage/repositories/base.repository.ts` — generic CRUD, every method returning `Result<T>`.
- `services/*` — ergonomic, dependency-injected business logic.

Hooks use Dexie's `liveQuery` (via `dexie-react-hooks`) so the UI re-renders automatically on any data change.

## Communication protocol

Typed, discriminated-union messages (`types/messages.ts`) wrapped in an envelope so foreign messages are ignored.

| Message | From → To | Purpose |
|---|---|---|
| `CHAT_OPENED` | content → background | Bookkeeping when a chat opens |
| `OPEN_SIDEBAR` | popup → content | Expand the sidebar (optionally on a section) |
| `RESCHEDULE_REMINDERS` | content → background | Reminders changed; re-evaluate alarms |

Cross-origin data (reminders, stats) is shared via `chrome.storage.local` because the background worker and popup run on the **extension origin** and cannot read the **page-origin** IndexedDB.

## Resilience

- **Result everywhere** at the storage boundary — never throws; the UI shows loading/empty/error states.
- **Per-section error boundaries** — one failing feature degrades to an inline message.
- **DatabaseGuard** — probes IndexedDB and shows a retryable fallback if storage is unavailable.
- **Extension-context guards** — all `chrome.*` calls from the content script are guarded against "Extension context invalidated".

## Testing

Pure logic is unit-tested with Vitest; repositories/services run against a real IndexedDB via `fake-indexeddb`. Notable suites: markdown parsing (incl. an infinite-loop regression guard), chat-change decisions, todo filter/sort, reminder scheduling math, and data export/import round-trips.
