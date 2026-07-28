import { db } from '@/storage/db';
import { tryCatch, type Result } from '@/utils/result';

export interface StorageUsage {
  counts: {
    chats: number;
    notes: number;
    todos: number;
    reminders: number;
    total: number;
  };
  /** Approximate bytes used by this origin, if the browser reports it. */
  bytes: number | null;
}

/** Per-table record counts plus an approximate on-disk size. */
export async function getStorageUsage(): Promise<Result<StorageUsage>> {
  return tryCatch(
    (async () => {
      const [chats, notes, todos, reminders] = await Promise.all([
        db.chats.count(),
        db.notes.count(),
        db.todos.count(),
        db.reminders.count(),
      ]);

      let bytes: number | null = null;
      if (typeof navigator !== 'undefined' && navigator.storage?.estimate) {
        const estimate = await navigator.storage.estimate();
        bytes = estimate.usage ?? null;
      }

      return {
        counts: { chats, notes, todos, reminders, total: chats + notes + todos + reminders },
        bytes,
      } satisfies StorageUsage;
    })(),
  );
}
