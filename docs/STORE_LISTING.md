# Chrome Web Store listing

Reference copy for the store submission. Keep in sync with `manifest.config.ts`
and the README.

## Name

WhatsApp Second Brain — Notes, Todos & Reminders

## Summary (132 chars max)

Private notes, todos & reminders for every WhatsApp Web chat. 100% local — nothing ever leaves your browser.

## Category

Productivity

## Detailed description

WhatsApp Second Brain adds a beautiful, private productivity panel to WhatsApp
Web. Every conversation gets its own notes, todos, and reminders — all stored
locally in your browser.

**Privacy first.** No backend. No servers. No analytics. No tracking. No
accounts. The extension never automates WhatsApp, never sends messages, and
never scrapes contacts. Your data never leaves your device.

**What you get**

• Notes — unlimited per-chat notes with Markdown, autosave, and instant search
• Todos — priorities, completion, sorting, filtering, and search
• Reminders — quick presets or a built-in calendar; Chrome notifications fire
  even when the sidebar is closed
• Settings — light/dark theme, export/import your data, delete-all, storage usage
• Browse everything — see every item across chats, grouped by conversation
• A resizable, collapsible sidebar that never gets in your way

Open WhatsApp Web, click the green button on the right edge, and start building
your second brain.

## Permission justifications

| Permission | Why it's needed |
|---|---|
| `storage` | Save your theme and sidebar preferences (your notes/todos/reminders live in the browser's IndexedDB). |
| `alarms` | Wake the extension at a reminder's due time to show a notification. |
| `notifications` | Show a desktop notification when a reminder is due. |
| Host access to `https://web.whatsapp.com/*` | Inject the sidebar and detect the open chat. This is the only site the extension can access. |

**No** `tabs`, no broad host permissions, no remote code, no analytics.

## Single purpose

A per-conversation productivity panel (notes, todos, reminders) for WhatsApp Web,
stored entirely on the user's device.

## Data usage disclosures

- Does the extension collect user data? **No.**
- Is data sold to third parties? **No.**
- Is data used for anything unrelated to the single purpose? **No.**

## Screenshots checklist (1280×800 or 640×400)

1. Sidebar open on a chat showing the **Notes** tab with a couple of notes.
2. **Todos** tab with mixed priorities and a completed task.
3. **Reminders** tab with the calendar/time picker open.
4. **Settings** with the storage usage rows.
5. The **all-data browser** grouped by chat.
6. A desktop **reminder notification** firing.

## Assets

- Store icon: `public/icon-128.png`
- Small promo tile / marquee: create from the icon + tagline as needed.
