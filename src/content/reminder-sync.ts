import { liveQuery, type Subscription } from 'dexie';
import { db } from '@/storage/db';
import { writePendingReminders, type ScheduledReminder } from '@/shared/reminder-schedule';
import type { Reminder } from '@/types/models';
import { isExtensionContextValid } from '@/utils/extension';
import { logger } from '@/utils/logger';
import { sendToBackground } from './bridge';

/**
 * Denormalize incomplete reminders (attaching each chat's display name) and push
 * them to `chrome.storage.local`, then ask the background worker to reschedule.
 */
async function sync(reminders: Reminder[]): Promise<void> {
  if (!isExtensionContextValid()) return;

  const pending = reminders.filter((reminder) => !reminder.completed);
  const chats = await db.chats.toArray();
  const nameByChatId = new Map(chats.map((chat) => [chat.chatId, chat.chatName]));

  const scheduled: ScheduledReminder[] = pending.map((reminder) => ({
    id: reminder.id,
    chatId: reminder.chatId,
    chatName: nameByChatId.get(reminder.chatId) ?? 'This chat',
    title: reminder.title,
    datetime: reminder.datetime,
  }));

  await writePendingReminders(scheduled);
  sendToBackground({ type: 'RESCHEDULE_REMINDERS' });
}

/**
 * Start mirroring reminders to the background. Returns a teardown function.
 * Runs in the content script (page origin) regardless of sidebar visibility, so
 * reminders keep firing while the panel is collapsed.
 */
export function startReminderSync(): () => void {
  const subscription: Subscription = liveQuery(() => db.reminders.toArray()).subscribe({
    next: (reminders) => {
      void sync(reminders);
    },
    error: (error) => logger.error('Reminder sync failed:', error),
  });

  return () => subscription.unsubscribe();
}
