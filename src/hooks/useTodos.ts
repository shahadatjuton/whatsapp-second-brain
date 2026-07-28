import { useLiveQuery } from 'dexie-react-hooks';
import { todosService } from '@/services/todos.service';
import type { Todo } from '@/types/models';
import { ok, type Result } from '@/utils/result';

/** Live list of a chat's todos. `undefined` while loading. */
export function useTodos(chatId: string | null): Result<Todo[]> | undefined {
  return useLiveQuery(async () => {
    if (!chatId) return ok<Todo[]>([]);
    return todosService.listByChat(chatId);
  }, [chatId]);
}
