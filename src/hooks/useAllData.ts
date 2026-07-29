import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/storage/db';
import type { Note, Reminder, Todo } from '@/types/models';

export interface AllData {
  chatNames: Record<string, string>;
  notes: Note[];
  todos: Todo[];
  reminders: Reminder[];
}

/** Live snapshot of every item across all chats, plus a chatId → name map. */
export function useAllData(): AllData | undefined {
  return useLiveQuery(async () => {
    const [chats, notes, todos, reminders] = await Promise.all([
      db.chats.toArray(),
      db.notes.toArray(),
      db.todos.toArray(),
      db.reminders.toArray(),
    ]);
    const chatNames = Object.fromEntries(chats.map((chat) => [chat.chatId, chat.chatName]));
    return { chatNames, notes, todos, reminders };
  }, []);
}
