import { z } from 'zod';
import { PRIORITIES } from '@/types/enums';
import type { Chat, Note, Todo, Reminder } from '@/types/models';

/**
 * Runtime validation schemas mirroring the domain models. They run at the
 * repository boundary so malformed data can never reach IndexedDB — and, just
 * as importantly, so imported JSON (Settings → Import) is validated before it
 * is trusted.
 *
 * Each schema is annotated with `z.ZodType<Model>`, which makes the compiler
 * fail the build if a schema and its model ever drift apart.
 */

const timestamp = z.number().int().nonnegative();

export const chatSchema: z.ZodType<Chat> = z.object({
  chatId: z.string().min(1),
  chatName: z.string(),
  lastOpened: timestamp,
  createdAt: timestamp,
});

export const noteSchema: z.ZodType<Note> = z.object({
  id: z.string().min(1),
  chatId: z.string().min(1),
  content: z.string(),
  createdAt: timestamp,
  updatedAt: timestamp,
});

export const todoSchema: z.ZodType<Todo> = z.object({
  id: z.string().min(1),
  chatId: z.string().min(1),
  title: z.string(),
  description: z.string(),
  priority: z.enum(PRIORITIES),
  completed: z.boolean(),
  createdAt: timestamp,
  updatedAt: timestamp,
});

export const reminderSchema: z.ZodType<Reminder> = z.object({
  id: z.string().min(1),
  chatId: z.string().min(1),
  title: z.string(),
  datetime: timestamp,
  completed: z.boolean(),
  createdAt: timestamp,
});
