import type { Reminder } from '@/types/models';
import { tryCatch, type Result } from '@/utils/result';
import { db } from '../db';
import { reminderSchema } from '../schemas';
import { ChatScopedRepository } from './chat-scoped.repository';

/** Persistence for per-chat reminders. */
export class RemindersRepository extends ChatScopedRepository<Reminder> {
  public constructor() {
    super(db.reminders, reminderSchema);
  }

  /**
   * Reminders that are due (fire time reached) and not yet completed. Used by
   * the background worker's periodic scan — indexed on `datetime` for speed.
   */
  public async getDue(now: number): Promise<Result<Reminder[]>> {
    return tryCatch(
      db.reminders
        .where('datetime')
        .belowOrEqual(now)
        .and((reminder) => !reminder.completed)
        .toArray(),
    );
  }

  /** The next upcoming reminder (soonest future fire time), if any. */
  public async getNextUpcoming(now: number): Promise<Result<Reminder | undefined>> {
    return tryCatch(
      db.reminders
        .where('datetime')
        .above(now)
        .and((reminder) => !reminder.completed)
        .first(),
    );
  }
}

export const remindersRepository = new RemindersRepository();
