import type { Todo } from '@/types/models';
import type { Priority } from '@/types/enums';
import type { IChatScopedRepository } from '@/storage/repository.types';
import { todosRepository } from '@/storage/repositories/todos.repository';
import { createId } from '@/utils/id';
import type { Result } from '@/utils/result';

export interface CreateTodoInput {
  title: string;
  description?: string;
  priority?: Priority;
}

/** Business logic for per-chat todos. */
export class TodosService {
  public constructor(
    private readonly repo: IChatScopedRepository<Todo> = todosRepository,
  ) {}

  public async listByChat(chatId: string): Promise<Result<Todo[]>> {
    return this.repo.getByChatId(chatId);
  }

  public async create(chatId: string, input: CreateTodoInput): Promise<Result<Todo>> {
    const now = Date.now();
    return this.repo.put({
      id: createId(),
      chatId,
      title: input.title,
      description: input.description ?? '',
      priority: input.priority ?? 'medium',
      completed: false,
      createdAt: now,
      updatedAt: now,
    });
  }

  public async update(
    id: string,
    changes: Partial<Pick<Todo, 'title' | 'description' | 'priority' | 'completed'>>,
  ): Promise<Result<Todo>> {
    return this.repo.update(id, { ...changes, updatedAt: Date.now() });
  }

  public async toggle(id: string, completed: boolean): Promise<Result<Todo>> {
    return this.repo.update(id, { completed, updatedAt: Date.now() });
  }

  public async remove(id: string): Promise<Result<void>> {
    return this.repo.delete(id);
  }
}

export const todosService = new TodosService();
