import type { Chat, ChatContext } from '@/types/models';
import type { IRepository } from '@/storage/repository.types';
import { chatsRepository, ChatsRepository } from '@/storage/repositories/chats.repository';
import type { Result } from '@/utils/result';

/**
 * Chat bookkeeping. Called by the ChatDetector when the active conversation
 * changes: creates the chat on first sight and refreshes `lastOpened`.
 */
export class ChatsService {
  public constructor(private readonly repo: IRepository<Chat> = chatsRepository) {}

  public async upsert(context: ChatContext): Promise<Result<Chat>> {
    const now = Date.now();
    const existing = await this.repo.getById(context.chatId);

    if (existing.ok && existing.value) {
      return this.repo.update(context.chatId, {
        chatName: context.chatName,
        lastOpened: now,
      });
    }

    return this.repo.put({
      chatId: context.chatId,
      chatName: context.chatName,
      lastOpened: now,
      createdAt: now,
    });
  }

  public async listRecent(): Promise<Result<Chat[]>> {
    // The concrete repository exposes recency ordering.
    if (this.repo instanceof ChatsRepository) {
      return this.repo.getRecent();
    }
    return this.repo.getAll();
  }
}

export const chatsService = new ChatsService();
