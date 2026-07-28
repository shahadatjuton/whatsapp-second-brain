import { useLiveQuery } from 'dexie-react-hooks';
import { notesService } from '@/services/notes.service';
import type { Note } from '@/types/models';
import { ok, type Result } from '@/utils/result';

/**
 * Live list of a chat's notes (most recently edited first). Backed by Dexie's
 * `liveQuery`, so it re-renders automatically whenever notes change — including
 * autosaves from the very card being edited. `undefined` means "still loading".
 */
export function useNotes(chatId: string | null): Result<Note[]> | undefined {
  return useLiveQuery(async () => {
    if (!chatId) return ok<Note[]>([]);
    return notesService.listByChat(chatId);
  }, [chatId]);
}
