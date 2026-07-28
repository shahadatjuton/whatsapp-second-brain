import { useLiveQuery } from 'dexie-react-hooks';
import { remindersService } from '@/services/reminders.service';
import type { Reminder } from '@/types/models';
import { ok, type Result } from '@/utils/result';

/** Live list of a chat's reminders, soonest first. `undefined` while loading. */
export function useReminders(chatId: string | null): Result<Reminder[]> | undefined {
  return useLiveQuery(async () => {
    if (!chatId) return ok<Reminder[]>([]);
    return remindersService.listByChat(chatId);
  }, [chatId]);
}
