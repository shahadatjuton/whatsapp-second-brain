import type { ZodType } from 'zod';
import { db } from '@/storage/db';
import {
  chatSchema,
  importBundleSchema,
  noteSchema,
  reminderSchema,
  todoSchema,
} from '@/storage/schemas';
import type { Chat, Note, Reminder, Todo } from '@/types/models';
import { isExtensionContextValid } from '@/utils/extension';
import { err, ok, tryCatch, type Result } from '@/utils/result';
import pkg from '../../package.json';

/** A full, portable backup of everything the user created. */
export interface ExportBundle {
  app: 'whatsapp-second-brain';
  version: string;
  exportedAt: number;
  data: {
    chats: Chat[];
    notes: Note[];
    todos: Todo[];
    reminders: Reminder[];
  };
}

export interface ImportSummary {
  chats: number;
  notes: number;
  todos: number;
  reminders: number;
  skipped: number;
}

/** Read every table into a single JSON-serializable bundle. */
export async function exportAllData(): Promise<Result<ExportBundle>> {
  return tryCatch(
    (async () => {
      const [chats, notes, todos, reminders] = await Promise.all([
        db.chats.toArray(),
        db.notes.toArray(),
        db.todos.toArray(),
        db.reminders.toArray(),
      ]);
      return {
        app: 'whatsapp-second-brain',
        version: pkg.version,
        exportedAt: Date.now(),
        data: { chats, notes, todos, reminders },
      } satisfies ExportBundle;
    })(),
  );
}

/** Validate each record against its schema, dropping (and counting) bad rows. */
function collectValid<T>(records: unknown[], schema: ZodType<T>): { valid: T[]; skipped: number } {
  const valid: T[] = [];
  let skipped = 0;
  for (const record of records) {
    const parsed = schema.safeParse(record);
    if (parsed.success) valid.push(parsed.data);
    else skipped += 1;
  }
  return { valid, skipped };
}

/**
 * Import a backup produced by {@link exportAllData}. Records are merged
 * (upserted by primary key) so importing never silently loses existing data.
 * Malformed rows are skipped and reported rather than failing the whole import.
 */
export async function importData(json: string): Promise<Result<ImportSummary>> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return err(new Error('That file is not valid JSON.'));
  }

  const root = importBundleSchema.safeParse(parsed);
  if (!root.success) {
    return err(new Error('Unrecognized backup format — expected a Second Brain export.'));
  }

  const { chats, notes, todos, reminders } = root.data.data;
  const validChats = collectValid<Chat>(chats, chatSchema);
  const validNotes = collectValid<Note>(notes, noteSchema);
  const validTodos = collectValid<Todo>(todos, todoSchema);
  const validReminders = collectValid<Reminder>(reminders, reminderSchema);

  return tryCatch(
    (async () => {
      await db.transaction('rw', db.chats, db.notes, db.todos, db.reminders, async () => {
        await db.chats.bulkPut(validChats.valid);
        await db.notes.bulkPut(validNotes.valid);
        await db.todos.bulkPut(validTodos.valid);
        await db.reminders.bulkPut(validReminders.valid);
      });
      return {
        chats: validChats.valid.length,
        notes: validNotes.valid.length,
        todos: validTodos.valid.length,
        reminders: validReminders.valid.length,
        skipped:
          validChats.skipped +
          validNotes.skipped +
          validTodos.skipped +
          validReminders.skipped,
      } satisfies ImportSummary;
    })(),
  );
}

/** Irreversibly clear all user data (and the mirrored reminder schedule). */
export async function deleteAllData(): Promise<Result<void>> {
  const cleared = await tryCatch(
    db.transaction('rw', db.chats, db.notes, db.todos, db.reminders, async () => {
      await Promise.all([db.chats.clear(), db.notes.clear(), db.todos.clear(), db.reminders.clear()]);
    }),
  );
  if (!cleared.ok) return cleared;

  if (isExtensionContextValid()) {
    try {
      await chrome.storage.local.remove(['reminders:pending', 'reminders:notified']);
    } catch {
      // Best-effort — the reminder sync will overwrite this shortly anyway.
    }
  }
  return ok(undefined);
}
