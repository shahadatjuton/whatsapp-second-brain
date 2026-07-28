import {
  computeNextDatetime,
  pruneNotifiedIds,
  readNotifiedIds,
  readPendingReminders,
  selectDueReminders,
  writeNotifiedIds,
} from '@/shared/reminder-schedule';
import { logger } from '@/utils/logger';
import { showReminderNotification } from './notification.service';

/** Precise alarm fired at the next reminder's due time. */
const NEXT_ALARM = 'reminders-next';
/** Safety-net alarm so nothing is missed if a precise alarm is dropped. */
const POLL_ALARM = 'reminders-poll';
const POLL_PERIOD_MINUTES = 1;

/**
 * Fire notifications for every reminder that is now due and not yet notified.
 * Notified ids are persisted so a reminder never double-fires.
 */
async function fireDueReminders(now: number): Promise<void> {
  const pending = await readPendingReminders();
  const notified = new Set(await readNotifiedIds());
  const due = selectDueReminders(pending, notified, now);
  if (due.length === 0) return;

  for (const reminder of due) {
    showReminderNotification(reminder);
    notified.add(reminder.id);
  }
  await writeNotifiedIds([...notified]);
}

/**
 * Recompute the precise next-due alarm and prune the notified set. A notified id
 * is kept only while its reminder still exists AND is still in the past — so a
 * rescheduled (future) reminder becomes eligible to fire again.
 */
async function rescheduleNextAlarm(now: number): Promise<void> {
  const pending = await readPendingReminders();
  const notified = pruneNotifiedIds(pending, await readNotifiedIds(), now);
  await writeNotifiedIds(notified);

  const nextDue = computeNextDatetime(pending, new Set(notified), now);
  if (nextDue != null) {
    chrome.alarms.create(NEXT_ALARM, { when: nextDue });
  } else {
    await chrome.alarms.clear(NEXT_ALARM);
  }
}

/** Fire anything due right now, then schedule the next precise alarm. */
export async function processReminders(now: number = Date.now()): Promise<void> {
  await fireDueReminders(now);
  await rescheduleNextAlarm(now);
}

/**
 * Register alarm handling and the periodic safety poll. Listeners are added at
 * the top level (MV3 requirement) via `initReminderScheduler` being called from
 * the service-worker entry.
 */
export function initReminderScheduler(): void {
  chrome.alarms.create(POLL_ALARM, { periodInMinutes: POLL_PERIOD_MINUTES });

  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === NEXT_ALARM || alarm.name === POLL_ALARM) {
      void processReminders();
    }
  });

  // Clicking a notification dismisses it.
  chrome.notifications.onClicked.addListener((id) => {
    chrome.notifications.clear(id);
  });

  void processReminders().catch((error) => logger.error('Reminder scheduling failed:', error));
}
