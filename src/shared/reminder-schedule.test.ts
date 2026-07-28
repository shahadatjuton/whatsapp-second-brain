import { describe, expect, it } from 'vitest';
import {
  computeNextDatetime,
  pruneNotifiedIds,
  selectDueReminders,
  type ScheduledReminder,
} from './reminder-schedule';

function makeReminder(id: string, datetime: number): ScheduledReminder {
  return { id, chatId: 'A', chatName: 'Alice', title: id, datetime };
}

const NOW = 1_000;

describe('selectDueReminders', () => {
  const pending = [makeReminder('past', 500), makeReminder('future', 5000), makeReminder('now', 1000)];

  it('returns past/at-now reminders not already notified', () => {
    const due = selectDueReminders(pending, new Set(), NOW).map((r) => r.id);
    expect(due).toEqual(['past', 'now']);
  });

  it('excludes already-notified reminders', () => {
    const due = selectDueReminders(pending, new Set(['past']), NOW).map((r) => r.id);
    expect(due).toEqual(['now']);
  });
});

describe('pruneNotifiedIds', () => {
  it('keeps only ids that still exist and are still in the past', () => {
    const pending = [makeReminder('kept', 500), makeReminder('rescheduled', 9000)];
    const notified = ['kept', 'rescheduled', 'deleted'];
    // 'rescheduled' moved to the future → eligible again; 'deleted' is gone.
    expect(pruneNotifiedIds(pending, notified, NOW)).toEqual(['kept']);
  });
});

describe('computeNextDatetime', () => {
  it('returns the soonest future, not-yet-notified fire time', () => {
    const pending = [makeReminder('a', 3000), makeReminder('b', 2000), makeReminder('past', 100)];
    expect(computeNextDatetime(pending, new Set(), NOW)).toBe(2000);
  });

  it('ignores notified reminders and returns undefined when none remain', () => {
    const pending = [makeReminder('a', 2000)];
    expect(computeNextDatetime(pending, new Set(['a']), NOW)).toBeUndefined();
  });
});
