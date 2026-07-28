import type { Note } from '@/types/models';
import type { IChatScopedRepository } from '@/storage/repository.types';
import { notesRepository } from '@/storage/repositories/notes.repository';
import { createId } from '@/utils/id';
import type { Result } from '@/utils/result';

/** Business logic for per-chat notes. Builds entities; delegates storage. */
export class NotesService {
  public constructor(
    private readonly repo: IChatScopedRepository<Note> = notesRepository,
  ) {}

  /** Notes for a chat, most recently edited first. */
  public async listByChat(chatId: string): Promise<Result<Note[]>> {
    const result = await this.repo.getByChatId(chatId);
    if (!result.ok) return result;
    const sorted = [...result.value].sort((a, b) => b.updatedAt - a.updatedAt);
    return { ok: true, value: sorted };
  }

  public async create(chatId: string, content = ''): Promise<Result<Note>> {
    const now = Date.now();
    return this.repo.put({
      id: createId(),
      chatId,
      content,
      createdAt: now,
      updatedAt: now,
    });
  }

  public async updateContent(id: string, content: string): Promise<Result<Note>> {
    return this.repo.update(id, { content, updatedAt: Date.now() });
  }

  public async remove(id: string): Promise<Result<void>> {
    return this.repo.delete(id);
  }
}

export const notesService = new NotesService();
