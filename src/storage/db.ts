import Dexie, { type Table } from 'dexie';
import type { Chat, Note, Todo, Reminder } from '@/types/models';
import { tryCatch, type Result } from '@/utils/result';

/**
 * Dexie database for the extension. Everything the user creates lives here,
 * inside IndexedDB, on their machine — nothing is ever sent anywhere.
 *
 * Index design follows the app's real query patterns:
 *  - notes/todos/reminders are always fetched `by chatId`.
 *  - notes sort by `updatedAt` (recently edited first).
 *  - todos filter by `completed`/`priority`.
 *  - reminders scan by `datetime` (due-time) in the background worker.
 */
export class SecondBrainDatabase extends Dexie {
  // `!` — Dexie assigns these in the `version().stores()` call below.
  public readonly chats!: Table<Chat, string>;
  public readonly notes!: Table<Note, string>;
  public readonly todos!: Table<Todo, string>;
  public readonly reminders!: Table<Reminder, string>;

  public constructor() {
    super('secondBrain');

    this.version(1).stores({
      chats: 'chatId, chatName, lastOpened, createdAt',
      notes: 'id, chatId, updatedAt, createdAt',
      todos: 'id, chatId, completed, priority, createdAt',
      reminders: 'id, chatId, datetime, completed, createdAt',
    });
  }
}

/** Singleton database instance shared across the extension surface. */
export const db = new SecondBrainDatabase();

/**
 * Probe whether IndexedDB is usable in the current context. Used by the UI to
 * show a graceful fallback instead of crashing (PRD "Error Handling").
 */
export async function isDatabaseAvailable(): Promise<Result<true>> {
  return tryCatch(db.open().then(() => true as const));
}
