import { defineManifest } from '@crxjs/vite-plugin';
import pkg from './package.json';

/**
 * Manifest V3 definition — least-privilege permissions only.
 *
 * - `storage`       : reserved for lightweight extension settings sync (data lives in IndexedDB).
 * - `alarms`        : schedule reminder due-time scans in the background service worker.
 * - `notifications` : fire Chrome notifications when a reminder is due.
 *
 * Host access is restricted to WhatsApp Web only. No `tabs`, no broad `scripting`,
 * no analytics, no remote hosts — nothing leaves the browser.
 */
export default defineManifest({
  manifest_version: 3,
  name: 'WhatsApp Second Brain',
  version: pkg.version,
  description:
    'Your private second brain for WhatsApp Web — notes, todos and reminders per chat. 100% local, zero data leaves your browser.',
  permissions: ['storage', 'alarms', 'notifications'],
  host_permissions: ['https://web.whatsapp.com/*'],
  icons: {
    16: 'icon-16.png',
    32: 'icon-32.png',
    48: 'icon-48.png',
    128: 'icon-128.png',
  },
  action: {
    default_title: 'WhatsApp Second Brain',
    default_popup: 'src/popup/index.html',
    default_icon: {
      16: 'icon-16.png',
      32: 'icon-32.png',
      48: 'icon-48.png',
      128: 'icon-128.png',
    },
  },
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  content_scripts: [
    {
      matches: ['https://web.whatsapp.com/*'],
      js: ['src/content/index.ts'],
      run_at: 'document_idle',
    },
  ],
});
