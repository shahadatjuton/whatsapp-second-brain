import { logger } from '@/utils/logger';

/**
 * Background service worker (Manifest V3) entry point.
 *
 * Responsibilities (fully implemented in later milestones):
 *  - Reminder scheduling via `chrome.alarms`.
 *  - Firing `chrome.notifications` when a reminder is due.
 *  - Handling lifecycle events (install/update) and cross-context messages.
 *
 * For Milestone 1 this only wires up install/startup logging so the worker
 * registers cleanly and the extension loads without errors.
 */

chrome.runtime.onInstalled.addListener((details) => {
  logger.info(`Installed/updated (${details.reason}).`);
});

chrome.runtime.onStartup.addListener(() => {
  logger.info('Service worker started.');
});

export {};
