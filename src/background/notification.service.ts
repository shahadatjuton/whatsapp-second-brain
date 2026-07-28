import type { ScheduledReminder } from '@/shared/reminder-schedule';

/** Fire a Chrome notification for a due reminder. */
export function showReminderNotification(reminder: ScheduledReminder): void {
  chrome.notifications.create(`reminder:${reminder.id}`, {
    type: 'basic',
    iconUrl: chrome.runtime.getURL('icon-128.png'),
    title: reminder.title || 'Reminder',
    message: reminder.chatName ? `Reminder · ${reminder.chatName}` : 'You have a reminder',
    priority: 2,
    requireInteraction: false,
  });
}
