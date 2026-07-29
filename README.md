# WhatsApp Second Brain

A privacy-first productivity extension for **WhatsApp Web**. It injects a beautiful, resizable sidebar that gives every conversation its own **notes, todos, and reminders** — all stored locally in your browser.

> **Privacy first.** No backend. No servers. No analytics. No tracking. No accounts. Nothing ever leaves your device. The extension never automates WhatsApp, never sends messages, and never scrapes contacts.

---

## Table of contents

- [Features](#features)
- [Installation](#installation)
- [Development](#development)
- [Build](#build)
- [Folder structure](#folder-structure)
- [Architecture](#architecture)
- [Privacy policy](#privacy-policy)
- [Future roadmap](#future-roadmap)

---

## Features

- **Per-chat Notes** — unlimited notes with Markdown support, autosave (no save button), and instant search.
- **Per-chat Todos** — priority (low/medium/high), completion, sort, filter, and search. Enter to add, Shift+Enter for a new line.
- **Per-chat Reminders** — quick presets (Tomorrow, Next week) or a custom date/time, delivered as Chrome notifications **even when the sidebar is collapsed or the tab is closed**.
- **Settings** — light/dark theme, export/import your data (JSON), delete-all, reset settings, storage usage, and version.
- **Resizable, collapsible sidebar** with light/dark mode and reduced-motion-friendly animations.
- **Popup** — quick open sidebar, settings shortcut, storage usage, and version.

---

## Installation

The extension targets **Manifest V3** browsers: Chrome, Edge, Brave, and Opera.

1. Build the extension (see [Build](#build)) — this produces a `dist/` folder.
2. Open your browser's extensions page:
   - Chrome/Brave: `chrome://extensions`
   - Edge: `edge://extensions`
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the `dist/` folder.
5. Open [web.whatsapp.com](https://web.whatsapp.com), open any chat, and click the floating green button on the right edge to open the sidebar.

> After reloading the extension, refresh the WhatsApp Web tab so it picks up the fresh content script.

---

## Development

Requires **Node.js 18+**.

```bash
npm install       # install dependencies
npm run dev       # start Vite in dev mode (HMR) — then "Load unpacked" the dist/ folder
npm test          # run the unit test suite (Vitest)
npm run lint      # ESLint (zero-warning policy)
npm run typecheck # strict TypeScript check
npm run gen:icons # regenerate the PNG icons in public/
```

During `npm run dev`, crxjs prints **"Load `dist` as unpacked extension"** and hot-reloads on changes.

### Quality gates

Every change must keep all of these green:

- `npm run typecheck` — strict TypeScript (`no any`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`).
- `npm run lint` — ESLint with `--max-warnings 0` (`@typescript-eslint/no-explicit-any` is an error).
- `npm test` — Vitest unit tests (real IndexedDB via `fake-indexeddb`).
- `npm run build` — production build.

---

## Build

```bash
npm run build     # tsc --noEmit && vite build → dist/
```

The output in `dist/` is a complete, loadable MV3 extension (manifest, background service worker, content script, popup, icons, and code-split section chunks).

---

## Folder structure

```
src/
  background/      Service worker: reminder scheduling (alarms) + notifications
  content/         Content script: sidebar injection, chat detection, sync mirrors
    chat-detector/ Resilient strategy-chain detector (MutationObserver + poll)
  popup/           Toolbar popup (React)
  sidebar/         The injected sidebar app
    layout/        Shell: header, tabs, resize handle, launcher, section outlet
    sections/      Notes / Todos / Reminders / Settings feature UIs
  components/       Reusable, presentational components
    ui/            Primitives: Button, Input, Modal, Checkbox, Select, …
  hooks/            React hooks (live queries, autosave, debounce, …)
  services/         Business logic over the repositories (DI-friendly)
  storage/          Dexie database, Zod schemas, repositories (SOLID)
    repositories/  BaseRepository + chat-scoped + per-entity repositories
  shared/           Cross-context contracts (reminder schedule, stats)
  state/            Zustand stores (UI + active chat)
  types/            Domain models, enums, and the message protocol
  utils/            Pure helpers (result, date, markdown, debounce, …)
  styles/           Tailwind entry (injected into the shadow root)
  assets/
```

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for a deeper tour, including the extension lifecycle and how the three contexts communicate.

---

## Architecture

Three isolated runtime contexts communicate only through Chrome messaging and shared storage:

- **Content script** (page origin) — injects the sidebar into a **Shadow DOM** (so our Tailwind styles never leak into WhatsApp and vice-versa), runs the **ChatDetector**, and owns the per-chat data in **IndexedDB** (via Dexie).
- **Sidebar** — a React app mounted by the content script. It shares the content script's JS context, so a Zustand store is the "bridge" between chat detection and the UI (no messaging needed there).
- **Background service worker** (extension origin) — schedules reminder alarms and fires notifications. Because it can't read the page-origin IndexedDB, the content script mirrors pending reminders (and storage stats) into `chrome.storage.local`, which the worker and popup read.

Key design choices:

- **Repository + Service layers** over Dexie (SOLID) — UI/hooks depend on interfaces, never on Dexie directly. This keeps future AI features a drop-in service.
- **Result-based error handling** — storage operations return `Result<T>` and never throw, so IndexedDB failures degrade gracefully (never crash).
- **Zod validation at the storage boundary** — malformed data (including imported JSON) can never reach the database.
- **Least-privilege manifest** — only `storage`, `alarms`, `notifications`, and host access to `web.whatsapp.com`.

---

## Privacy policy

This extension stores everything **locally inside your browser** using IndexedDB. **No data is sent to any server.** There is no telemetry, no analytics, and no tracking. Your notes, todos, and reminders never leave your device. Use **Settings → Export data** to back up, and **Delete all data** to remove everything.

---

## Future roadmap (v2)

These are intentionally **not** in this version and are designed to plug into the existing service layer:

- AI summaries, semantic search, and chat memory
- Bookmarks, voice transcription, OCR, and file indexing
- Relationship memory and a knowledge graph

---

Built with React, TypeScript, Vite, Tailwind CSS, Zustand, Dexie, Framer Motion, React Hook Form, Zod, and Lucide. Manifest V3.
