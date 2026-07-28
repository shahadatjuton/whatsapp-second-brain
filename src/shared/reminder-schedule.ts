/**
 * Cross-context reminder scheduling contract.
 *
 * The content script (page origin) owns the reminders in IndexedDB; the
 * background service worker (extension origin) fires the notifications. Since
 * they can't share IndexedDB, the content script mirrors the pending reminders
 * into `chrome.storage.local` (readable by both), and the background reads them
 * to schedule alarms and notify — even while the sidebar is collapsed.
 */

export const PENDING_REMINDERS_KEY = 'reminders:pending';
export const NOTIFIED_REMINDERS_KEY = 'reminders:notified';

/** A denormalized reminder the background can act on without the database. */
export interface ScheduledReminder {
  id: string;
  chatId: string;
  chatName: string;
  title: string;
  /** Fire time, epoch ms. */
  datetime: number;
}

async function safeGet<T>(key: string, fallback: T): Promise<T> {
  try {
    const result = await chrome.storage.local.get(key);
    const value = result[key];
    return (value as T | undefined) ?? fallback;
  } catch {
    return fallback;
  }
}

async function safeSet(key: string, value: unknown): Promise<void> {
  try {
    await chrome.storage.local.set({ [key]: value });
  } catch {
    // Storage unavailable (orphaned context) — degrade to no-op.
  }
}

export function readPendingReminders(): Promise<ScheduledReminder[]> {
  return safeGet<ScheduledReminder[]>(PENDING_REMINDERS_KEY, []);
}

export function writePendingReminders(reminders: ScheduledReminder[]): Promise<void> {
  return safeSet(PENDING_REMINDERS_KEY, reminders);
}

export function readNotifiedIds(): Promise<string[]> {
  return safeGet<string[]>(NOTIFIED_REMINDERS_KEY, []);
}

export function writeNotifiedIds(ids: string[]): Promise<void> {
  return safeSet(NOTIFIED_REMINDERS_KEY, ids);
}

// --- Pure scheduling logic (unit-tested; no chrome APIs) ---

/** Reminders that are due now and haven't been notified yet. */
export function selectDueReminders(
  pending: ScheduledReminder[],
  notified: ReadonlySet<string>,
  now: number,
): ScheduledReminder[] {
  return pending.filter((reminder) => reminder.datetime <= now && !notified.has(reminder.id));
}

/**
 * Keep a notified id only while its reminder still exists and remains in the
 * past — so a deleted/completed reminder is forgotten and a rescheduled (future)
 * reminder becomes eligible to fire again.
 */
export function pruneNotifiedIds(
  pending: ScheduledReminder[],
  notifiedIds: string[],
  now: number,
): string[] {
  const byId = new Map(pending.map((reminder) => [reminder.id, reminder]));
  return notifiedIds.filter((id) => {
    const reminder = byId.get(id);
    return reminder != null && reminder.datetime <= now;
  });
}

/** The soonest future fire time among not-yet-notified reminders, if any. */
export function computeNextDatetime(
  pending: ScheduledReminder[],
  notified: ReadonlySet<string>,
  now: number,
): number | undefined {
  return pending
    .filter((reminder) => reminder.datetime > now && !notified.has(reminder.id))
    .map((reminder) => reminder.datetime)
    .sort((a, b) => a - b)[0];
}
