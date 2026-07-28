import { db } from '@/storage/db';
import type { StorageUsage } from '@/shared/stats';
import { tryCatch, type Result } from '@/utils/result';

export type { StorageUsage };

/**
 * Per-table record counts plus an approximate size of the user's own data.
 *
 * We measure the serialized byte length of our records rather than
 * `navigator.storage.estimate()`, because the latter reports the *entire*
 * web.whatsapp.com origin (WhatsApp's own storage included), which would be
 * misleading here.
 */
export async function getStorageUsage(): Promise<Result<StorageUsage>> {
  return tryCatch(
    (async () => {
      const [chats, notes, todos, reminders] = await Promise.all([
        db.chats.toArray(),
        db.notes.toArray(),
        db.todos.toArray(),
        db.reminders.toArray(),
      ]);

      const json = JSON.stringify({ chats, notes, todos, reminders });
      const bytes = new TextEncoder().encode(json).length;

      return {
        counts: {
          chats: chats.length,
          notes: notes.length,
          todos: todos.length,
          reminders: reminders.length,
          total: chats.length + notes.length + todos.length + reminders.length,
        },
        bytes,
      } satisfies StorageUsage;
    })(),
  );
}
