import type { Todo } from '@/types/models';
import { db } from '../db';
import { todoSchema } from '../schemas';
import { ChatScopedRepository } from './chat-scoped.repository';

/** Persistence for per-chat todos. */
export class TodosRepository extends ChatScopedRepository<Todo> {
  public constructor() {
    super(db.todos, todoSchema);
  }
}

export const todosRepository = new TodosRepository();
