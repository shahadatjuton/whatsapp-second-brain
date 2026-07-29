# Changelog

All notable changes to this project are documented here. This project adheres to
[Semantic Versioning](https://semver.org/).

## [1.0.0] — 2026-07-29

First public release.

### Added

- **Notes** — unlimited per-chat notes with Markdown support, 1-second autosave
  (no save button), preview, and instant search.
- **Todos** — per-chat tasks with priority (low/medium/high), completion,
  sort, filter, and search; Enter to add, Shift+Enter for a new line.
- **Reminders** — per-chat reminders with quick presets (Tomorrow, Next week) or
  a built-in calendar/time picker, delivered as Chrome notifications even when
  the sidebar is collapsed or the tab is closed. Clicking a notification opens
  WhatsApp and the reminders.
- **Settings** — light/dark theme, JSON export/import, delete-all, reset,
  storage usage, and version.
- **Data browser** — tap a storage count in Settings to browse every item across
  chats (grouped by conversation), with search and inline delete.
- **Popup** — quick open sidebar, settings shortcut, storage usage, and version.
- Injected, resizable, collapsible Shadow-DOM sidebar with light/dark mode and
  reduced-motion-friendly animations.
- 100% local: IndexedDB storage, no backend, no analytics, no tracking.

### Notes

- Long lists use Chromium's `content-visibility` for smooth scrolling at scale.
- Least-privilege permissions: `storage`, `alarms`, `notifications`, and host
  access to `web.whatsapp.com` only.
