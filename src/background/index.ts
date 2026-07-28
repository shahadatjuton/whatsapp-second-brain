import { isEnvelope } from '@/types/messages';
import { logger } from '@/utils/logger';
import { initReminderScheduler, processReminders } from './reminder-scheduler';

/**
 * Background service worker (Manifest V3) entry point.
 *
 * Responsibilities:
 *  - Lifecycle events (install/update/startup).
 *  - Receiving cross-context messages from the content script.
 *  - Reminder scheduling via `chrome.alarms` + `chrome.notifications`.
 *
 * NOTE: the service worker runs on the EXTENSION origin, so it cannot read the
 * page-origin IndexedDB where reminders live. The content script mirrors pending
 * reminders into `chrome.storage.local` (see shared/reminder-schedule), which
 * this worker reads to schedule and fire notifications.
 */

// Registered at top level so the worker can wake on alarms even after idling.
initReminderScheduler();

chrome.runtime.onInstalled.addListener((details) => {
  logger.info(`Installed/updated (${details.reason}).`);
  void processReminders();
});

chrome.runtime.onStartup.addListener(() => {
  logger.info('Service worker started.');
  void processReminders();
});

chrome.runtime.onMessage.addListener((raw) => {
  if (!isEnvelope(raw)) return;

  switch (raw.message.type) {
    case 'CHAT_OPENED':
      logger.info('Chat opened:', raw.message.payload.chatName);
      break;
    case 'RESCHEDULE_REMINDERS':
      // Reminders changed in the page — re-evaluate due/upcoming immediately.
      void processReminders();
      break;
    default:
      break;
  }
});

export {};
