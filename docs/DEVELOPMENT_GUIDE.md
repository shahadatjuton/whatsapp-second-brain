# Development Guide — WhatsApp Second Brain

A from-scratch guide for developers who are **new to Chrome extensions**. It explains
how browser extensions work in general, then how *this* project is built, and finally
how to run, debug, test, and extend it.

> If you only read one thing: an extension is not one program — it's **several small
> programs running in different places** that talk to each other through messages.
> Most of the confusion when starting out comes from not knowing *which* program your
> code is running in. Keep that in mind throughout.

---

## Table of contents

1. [Prerequisites](#1-prerequisites)
2. [Chrome extension basics (Manifest V3)](#2-chrome-extension-basics-manifest-v3)
3. [The tech stack we use (and why)](#3-the-tech-stack-we-use-and-why)
4. [Getting the project running](#4-getting-the-project-running)
5. [The big picture: the four runtime contexts](#5-the-big-picture-the-four-runtime-contexts)
6. [Folder structure](#6-folder-structure)
7. [The layered architecture](#7-the-layered-architecture)
8. [Deep dives on the tricky parts](#8-deep-dives-on-the-tricky-parts)
9. [Debugging](#9-debugging)
10. [Testing](#10-testing)
11. [Recipe: add a new feature end-to-end](#11-recipe-add-a-new-feature-end-to-end)
12. [Gotchas we learned the hard way](#12-gotchas-we-learned-the-hard-way)
13. [Glossary](#13-glossary)

---

## 1. Prerequisites

You should be comfortable with:

- **JavaScript/TypeScript** basics (functions, `async/await`, `import/export`).
- **React** basics (components, `useState`, `useEffect`).
- Running commands in a terminal, and **Node.js 18+** installed.

You do **not** need prior extension experience — that's what section 2 is for.

Helpful but optional: Tailwind CSS, IndexedDB, Zustand. We'll explain how we use each.

---

## 2. Chrome extension basics (Manifest V3)

A Chrome extension (in the current standard, **Manifest V3** / "MV3") is a folder of files
described by one required file: **`manifest.json`**. The manifest tells the browser what
the extension is, what permissions it needs, and which scripts run where.

An extension is made of a few **independent parts**, each running in its own sandbox:

| Part | Where it runs | Lifetime | Typical job |
|---|---|---|---|
| **Content script** | *Inside a web page* you specify (for us, `web.whatsapp.com`) | While that tab is open | Read/modify the page's DOM; we inject our sidebar here |
| **Background service worker (SW)** | A hidden, extension-owned context | Wakes on events, then sleeps | Alarms, notifications, long-lived logic |
| **Popup** | A small window from the toolbar icon | While the popup is open | Quick actions/status |
| **Options/other pages** | Extension-owned HTML pages | While open | Settings pages (we don't use a separate one) |

Two ideas that trip up beginners:

1. **They are isolated.** The content script and the background worker are *different
   programs*. They **cannot** call each other's functions directly. They communicate with
   **messages** (`chrome.runtime.sendMessage`) or via shared storage (`chrome.storage`).

2. **"Origins" matter for storage.** The content script runs *inside the web page*, so its
   `IndexedDB`/`localStorage` belong to **that page's origin** (`web.whatsapp.com`). The
   background worker and popup run on the **extension's own origin**
   (`chrome-extension://<id>`). These are **two separate storage buckets.** This single fact
   explains several design decisions later (why reminders are "mirrored" to `chrome.storage`).

### The permission model

MV3 rewards **least privilege**. You request only what you need:

- `permissions` — capabilities, e.g. `storage`, `alarms`, `notifications`.
- `host_permissions` — which sites you can touch, e.g. `https://web.whatsapp.com/*`.

We deliberately avoid `<all_urls>` and `tabs`. Fewer permissions = faster store review and
more user trust. See `manifest.config.ts`.

---

## 3. The tech stack we use (and why)

| Tool | Why |
|---|---|
| **TypeScript (strict)** | Catch bugs at compile time. We forbid `any`. |
| **Vite** | Fast dev server + bundler. |
| **@crxjs/vite-plugin** | Makes Vite understand MV3: it reads our manifest, bundles the background/content/popup, and gives hot-reload in dev. |
| **React 18** | UI for the sidebar and popup. |
| **Tailwind CSS** | Utility-first styling; no separate CSS files to maintain. |
| **Zustand** | Tiny state store for UI state (active tab, theme, blur settings). |
| **Dexie** | A friendly wrapper over **IndexedDB** (the browser's local database). |
| **Zod** | Runtime validation — makes sure only valid data reaches the database. |
| **Framer Motion** | Animations. |
| **React Hook Form** | Forms (e.g. the todo editor). |
| **dayjs** | Dates/times. |
| **Lucide** | Icons. |
| **Vitest + Testing Library + fake-indexeddb** | Tests. |

> **Why no backend/servers?** This product is privacy-first. *Everything* is stored locally
> in the browser (IndexedDB). Nothing is ever uploaded. Keep it that way.

---

## 4. Getting the project running

```bash
npm install        # install dependencies

# Option A — development (hot reload while you edit):
npm run dev        # starts Vite; keep this terminal open

# Option B — production build (self-contained, what you ship):
npm run build      # outputs the extension into dist/
```

**Load it into the browser** (Chrome / Edge / Brave — all Chromium):

1. Open `chrome://extensions`.
2. Turn on **Developer mode** (top-right).
3. Click **Load unpacked** → select the **`dist/`** folder.
4. Open <https://web.whatsapp.com>, open a chat, click the green button on the right edge.

> **Important dev nuance:** `npm run dev` produces a `dist/` that *depends on the Vite dev
> server running*. If you stop the server, that `dist/` breaks. For normal use/testing,
> prefer `npm run build`. Whenever you reload the extension, also **reload the WhatsApp tab**
> (the old content script becomes an orphan — see [Gotchas](#12-gotchas-we-learned-the-hard-way)).

**Quality gates** (all must stay green):

```bash
npm run typecheck   # strict TypeScript (no `any`)
npm run lint        # ESLint, zero warnings allowed
npm test            # Vitest unit/component tests
npm run build       # production build
```

Extra helpers: `npm run gen:icons` (regenerate PNG icons), `node scripts/gen-test-data.mjs 1000`
(make a big import file for load-testing).

---

## 5. The big picture: the four runtime contexts

```
┌──────────────────────────── web.whatsapp.com page ────────────────────────────┐
│                                                                                │
│   CONTENT SCRIPT  ── mounts ──▶  SIDEBAR (React, in a Shadow DOM)               │
│   (src/content)                  (src/sidebar)                                  │
│    • injects the sidebar          • Notes / Todos / Reminders / Settings UI     │
│    • detects the open chat        • reads/writes IndexedDB directly             │
│    • owns IndexedDB (page origin) • shares the SAME JS context as content       │
│    • privacy blur, sync mirrors                                                 │
└───────────────┬───────────────────────────────────────────────────────────────┘
                │ chrome.runtime messages           │ chrome.storage (shared)
                ▼                                    ▼
      ┌──────────────────────┐            ┌───────────────────────────┐
      │ BACKGROUND WORKER    │            │ POPUP (React)             │
      │ (src/background)     │            │ (src/popup)               │
      │ • reminder alarms    │            │ • open sidebar, usage     │
      │ • notifications      │            │ • reads chrome.storage    │
      └──────────────────────┘            └───────────────────────────┘
```

Key relationships to internalize:

- **Content script and sidebar share one JavaScript context.** The content script *mounts*
  the React sidebar, so they can share a Zustand store directly — **no messaging needed
  between them**. (This is why `state/chat.store.ts` works as the "bridge".)
- **Content ↔ Background** use `chrome.runtime` messages (typed — see `types/messages.ts`).
- **Cross-origin data** (reminders, storage stats) is shared via `chrome.storage.local`
  because the background/popup can't read the page-origin IndexedDB.

---

## 6. Folder structure

```
src/
  background/      Service worker: reminder scheduling (alarms) + notifications
  content/         Content script: injects the sidebar, detects the chat, sync mirrors
    chat-detector/ Figures out which WhatsApp chat is open (strategy chain)
  popup/           Toolbar popup (React)
  sidebar/         The injected sidebar app
    layout/        Shell: header, tabs, resize handle, launcher, section router
    sections/      Notes / Todos / Reminders / Settings feature UIs
  components/       Reusable, presentational components
    ui/            Primitives: Button, Input, Modal, Toggle, Select, …
  hooks/            React hooks (live DB queries, autosave, debounce, …)
  services/         Business logic layered over the repositories
  storage/          Dexie database, Zod schemas, repositories (the data layer)
    repositories/  BaseRepository + chat-scoped + per-entity repositories
  shared/           Contracts used by BOTH page and extension origins
  state/            Zustand stores (UI state + active chat)
  types/            Domain models, enums, and the message protocol
  utils/            Pure helpers (Result, date, markdown, debounce, …)
  styles/           Tailwind entry (injected into the shadow root)
manifest.config.ts  The MV3 manifest, written in TypeScript
vite.config.ts      Vite + crxjs config
```

A good habit: **before editing, ask "which context does this file run in?"** Files in
`content/`, `sidebar/`, `components/`, `hooks/`, `state/`, `storage/`, `services/` run in the
**page** (content) context. `background/` runs in the **worker**. `popup/` runs in the
**popup**. `shared/`, `types/`, `utils/` are context-neutral.

---

## 7. The layered architecture

We keep a clean separation so features are easy to add and test. Data flows top-to-bottom:

```
React components  (what the user sees)
      │  use
Hooks             (live data + view logic: useNotes, useDebounce, …)
      │  call
Services          (business logic: NotesService.create(), …)
      │  call
Repositories      (CRUD behind an interface: IRepository<T>)
      │  use
Dexie (IndexedDB) (the actual local database)
```

Why bother with layers?

- **The UI never touches the database directly.** It depends on *interfaces*, not Dexie.
  This is the "D" in SOLID (depend on abstractions).
- Each layer is independently testable. We test repositories/services against a real (fake)
  IndexedDB, and pure helpers in isolation.
- Adding a feature is mechanical: model → schema → repository → service → hook → component.

Two cross-cutting helpers make this safe:

- **`Result<T>`** (`utils/result.ts`): storage operations **never throw** — they return
  `{ ok: true, value }` or `{ ok: false, error }`. The UI shows loading/empty/error states
  instead of crashing.
- **Zod schemas** (`storage/schemas.ts`): every record is validated *before* it hits the
  database, and imported JSON is validated before it's trusted.

---

## 8. Deep dives on the tricky parts

### 8.1 The manifest (`manifest.config.ts`)

We write the manifest in TypeScript (crxjs turns it into `manifest.json` at build). It
declares permissions, the background worker, the content script, the popup, and icons.
Keep permissions minimal.

### 8.2 Injecting the sidebar with **Shadow DOM** (`content/mount.tsx`)

We can't just drop our HTML into WhatsApp's page — our Tailwind styles would leak into
WhatsApp and vice-versa. Solution: **Shadow DOM**, a browser feature that creates an
*isolated* DOM subtree with its own styles.

```ts
const host = document.createElement('div');
document.body.appendChild(host);
const shadow = host.attachShadow({ mode: 'open' }); // isolated world
const style = document.createElement('style');
style.textContent = compiledTailwindCss;            // our CSS, scoped to the shadow
shadow.appendChild(style);
createRoot(mountPoint).render(<SidebarApp />);       // React renders inside the shadow
```

Result: our styles and WhatsApp's styles never collide.

### 8.3 The database with **Dexie** (`storage/`)

IndexedDB is the browser's built-in database. Dexie makes it pleasant.

```ts
// storage/db.ts — declare tables and their indexes
this.version(1).stores({
  notes: 'id, chatId, updatedAt, createdAt', // 'id' is the primary key; others are indexes
});
```

We never call Dexie from the UI. Instead:

- **Repositories** wrap a table and return `Result`s (`repositories/base.repository.ts`).
- **Services** add business logic (`services/notes.service.ts`): building an entity with an
  id + timestamps, sorting, etc.
- **Hooks** expose *live* data with `useLiveQuery` (from `dexie-react-hooks`) — the UI
  re-renders automatically whenever the data changes.

```ts
// hooks/useNotes.ts — live, auto-updating list of a chat's notes
export function useNotes(chatId: string | null) {
  return useLiveQuery(async () => (chatId ? notesService.listByChat(chatId) : ok([])), [chatId]);
}
```

### 8.4 UI state with **Zustand** (`state/ui.store.ts`)

Zustand is a tiny store for *UI* state (active tab, theme, sidebar width, blur options) —
**not** for your data (that lives in IndexedDB). It persists some keys to `chrome.storage`
so preferences survive reloads.

```ts
const theme = useUIStore((s) => s.theme);       // read
const setTheme = useUIStore((s) => s.setTheme);  // write
```

> Tip: select **one value at a time** (`useUIStore(s => s.theme)`). Returning a **new
> object** from a selector causes needless re-renders.

### 8.5 Detecting the open chat (`content/chat-detector/`)

WhatsApp doesn't tell us which chat is open, and its HTML class names are scrambled and
change often. So detection is a **strategy chain** with a stable fallback:

1. Read the chat's **JID** (its unique id, e.g. `123@c.us`) from a message element's
   `data-id`.
2. If that fails, fall back to a `name:`-prefixed id from the header title.

It uses a **debounced `MutationObserver`** (fires when the page changes) plus a periodic
poll, and it's **sticky** — it won't drop the active chat on a transient miss. The core
decision is a **pure function** (`decideChatChange`) so it's unit-tested.

### 8.6 The background worker: alarms, notifications, and cross-origin storage

Reminders must fire even when the sidebar is closed. But the worker **can't read the
page-origin IndexedDB.** So:

1. The content script watches reminders (`content/reminder-sync.ts`) and **mirrors** the
   pending list into `chrome.storage.local` (readable by both sides — `shared/reminder-schedule.ts`).
2. The background worker (`background/reminder-scheduler.ts`) reads that, sets a
   `chrome.alarms` alarm, and fires a `chrome.notifications` notification when due.

This "mirror to `chrome.storage`" pattern is how any extension shares data across the
page/extension origin boundary.

### 8.7 The message protocol (`types/messages.ts`)

Cross-context messages are **typed** (a discriminated union wrapped in an envelope) so the
compiler enforces correct handling and foreign messages are ignored.

```ts
type ExtensionMessage =
  | { type: 'CHAT_OPENED'; payload: ChatContext }
  | { type: 'OPEN_SIDEBAR'; section?: Section }
  | { type: 'RESCHEDULE_REMINDERS' };
```

### 8.8 The privacy blur (`content/privacy-blur.ts`)

An example of *modifying the WhatsApp page* safely: we inject a `<style>` into the page and
toggle CSS classes on `<html>` from the shared store. It reads no data — it's just CSS —
and it's fully local. Study this file to learn the "inject page CSS + react to store"
pattern.

---

## 9. Debugging

Extensions have **multiple consoles** — one per context. This is the #1 thing to learn.

- **Content script + sidebar:** open DevTools **on the WhatsApp tab** (F12). Our logs are
  prefixed `[WA Second Brain]`. Filter the Console by that.
- **Background worker:** `chrome://extensions` → find the extension → click **"service
  worker"** (or "Inspect views: service worker"). That opens *its own* DevTools.
- **Popup:** right-click the popup → **Inspect**.

Other tips:

- After changing code and rebuilding, click **Reload** on `chrome://extensions`, then
  **reload the WhatsApp tab**.
- Use the **Application** tab in DevTools → IndexedDB → `secondBrain` to see stored data,
  and → Storage → Extension storage for `chrome.storage`.
- Use the **Performance/Memory** tabs to profile (switch chats ~20× and watch memory).

---

## 10. Testing

We use **Vitest**. Two environments:

- **Node** tests (`*.test.ts`) — pure logic + repository/service tests, using
  `fake-indexeddb` so Dexie works without a browser.
- **jsdom** tests (`*.test.tsx`) — component/render tests with React Testing Library. Add
  `// @vitest-environment jsdom` at the top of those files.

```bash
npm test            # run once
npm run test:watch  # watch mode while developing
```

What to test (and what we do):

- **Pure helpers** — markdown parsing, chat-change decisions, todo filter/sort, reminder
  scheduling math. (Cheap, high-value.)
- **Repositories/services** — CRUD + validation against fake IndexedDB.
- **A few components** — that they render and respond to clicks (this catches render bugs
  that pure tests can't).

---

## 11. Recipe: add a new feature end-to-end

Say you want to add **"Bookmarks"**. Follow the layers top-down, and you'll touch these
files in order:

1. **Model** — `types/models.ts`: add `interface Bookmark { id; chatId; … }`.
2. **Enum** (if needed) — `types/enums.ts`: e.g. `BOOKMARK_CATEGORIES`, and add `'bookmarks'`
   to `SECTIONS`.
3. **Schema** — `storage/schemas.ts`: `bookmarkSchema` (validation), so bad data can't be saved.
4. **Migration** — `storage/db.ts`: `this.version(2).stores({ bookmarks: 'id, chatId, …' })`.
   *Never remove or repurpose existing columns — only add.* Migrations must preserve v1 data.
5. **Repository** — `storage/repositories/bookmarks.repository.ts`: extend `ChatScopedRepository`.
6. **Service** — `services/bookmarks.service.ts`: `create/list/remove`, DI-friendly.
7. **Hook** — `hooks/useBookmarks.ts`: `useLiveQuery` wrapping the service.
8. **UI** — `sidebar/sections/BookmarksSection.tsx` + any `sidebar/sections/bookmarks/*`
   sub-components, reusing `components/ui/*` (Button, EmptyState, SearchInput, DeleteButton…).
9. **Navigation** — register the section in `sidebar/layout/SectionOutlet.tsx` and
   `SectionTabs.tsx`.
10. **Tests** — a repository/service test + a small component test.
11. **Docs** — update README/ARCHITECTURE/CHANGELOG.
12. **Verify** — `npm run typecheck && npm run lint && npm test && npm run build`.

Reuse, don't reinvent: we already have `Button`, `Input`, `Textarea`, `Select`, `Checkbox`,
`Toggle`, `Modal`, `ConfirmDialog`, `DeleteButton`, `SearchInput`, `EmptyState`, `Spinner`,
`Badge`, `DateTimePicker`, plus hooks like `useDebounce` and `useActiveChat`.

---

## 12. Gotchas we learned the hard way

- **"Extension context invalidated."** When you reload the extension, the old content script
  in an open tab becomes an **orphan** — any `chrome.*` call throws. We guard every
  `chrome.*` call with `isExtensionContextValid()` and a watchdog tears the orphan down. As a
  user, **reload the WhatsApp tab** after reloading the extension.
- **`chrome.runtime.sendMessage` throws *synchronously*** on an invalidated context — a
  `.catch()` alone isn't enough; wrap it in `try/catch` too (see `content/bridge.ts`).
- **Don't code-split the content script.** `React.lazy` in a content script fetches chunk
  files at runtime that can 404 after a rebuild ("Failed to fetch dynamically imported
  module"). Keep the content bundle self-contained.
- **Origins differ.** Page-origin IndexedDB ≠ extension-origin storage. Share via
  `chrome.storage` (see reminders/stats).
- **WhatsApp's DOM is unstable.** Anything that reads/modifies WhatsApp's own elements
  (detection, blur, message bookmarks) uses resilient selectors + graceful fallbacks, and may
  need occasional selector tweaks.
- **Long lists.** Use the `.cv-list-item` class (CSS `content-visibility`) so 10k+ rows scroll
  smoothly, instead of runtime virtualization libraries.
- **Blobs don't JSON-serialize.** File attachments (Blobs) are excluded from JSON export.

---

## 13. Glossary

- **Manifest V3 (MV3):** the current Chrome extension format.
- **Content script:** JS injected into a specific web page; can read/modify that page's DOM.
- **Service worker (background):** a background context that wakes on events (alarms,
  messages) and sleeps otherwise.
- **Shadow DOM:** an isolated DOM subtree with its own styles; we render our UI inside one.
- **IndexedDB:** the browser's built-in local database. **Dexie** is our wrapper.
- **Origin:** scheme + host (e.g. `https://web.whatsapp.com`). Storage is per-origin.
- **JID:** WhatsApp's unique chat id (e.g. `123@c.us`), used to scope data per chat.
- **`chrome.storage`:** small key/value storage shared across extension contexts.
- **`chrome.alarms` / `chrome.notifications`:** schedule wake-ups / show desktop notifications.
- **Zustand:** minimal state store for UI state.
- **Zod:** runtime schema validation.
- **`Result<T>`:** our non-throwing return type (`{ ok, value } | { ok, error }`).

---

Happy building. When in doubt, trace a feature through the layers in section 7 — the code is
organized so you can always follow the same path from a button click down to IndexedDB.
