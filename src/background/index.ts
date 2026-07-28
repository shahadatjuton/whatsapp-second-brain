import { isEnvelope } from '@/types/messages';
import { logger } from '@/utils/logger';

/**
 * Background service worker (Manifest V3) entry point.
 *
 * Responsibilities:
 *  - Lifecycle events (install/update/startup).
 *  - Receiving cross-context messages from the content script.
 *  - Reminder scheduling via `chrome.alarms` + `chrome.notifications` (M7).
 *
 * NOTE: the service worker runs on the EXTENSION origin, so it cannot read the
 * page-origin IndexedDB where notes/todos/reminders live. Reminder data will be
 * mirrored to `chrome.storage.local` by the content script in M7.
 */

chrome.runtime.onInstalled.addListener((details) => {
  logger.info(`Installed/updated (${details.reason}).`);
});

chrome.runtime.onStartup.addListener(() => {
  logger.info('Service worker started.');
});

chrome.runtime.onMessage.addListener((raw) => {
  if (!isEnvelope(raw)) return;

  switch (raw.message.type) {
    case 'CHAT_OPENED':
      // Bookkeeping hook — reminder rescheduling attaches here in M7.
      logger.info('Chat opened:', raw.message.payload.chatName);
      break;
    default:
      break;
  }
});

export {};
