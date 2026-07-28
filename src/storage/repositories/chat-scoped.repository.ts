import { tryCatch, type Result } from '@/utils/result';
import type { IChatScopedRepository } from '../repository.types';
import { BaseRepository } from './base.repository';

/**
 * Base for entities that belong to a chat. Adds `chatId`-scoped read/delete on
 * top of the generic CRUD, so the three feature repositories stay DRY.
 */
export abstract class ChatScopedRepository<T extends { chatId: string }>
  extends BaseRepository<T>
  implements IChatScopedRepository<T>
{
  public async getByChatId(chatId: string): Promise<Result<T[]>> {
    return tryCatch(this.table.where('chatId').equals(chatId).toArray());
  }

  public async deleteByChatId(chatId: string): Promise<Result<number>> {
    return tryCatch(this.table.where('chatId').equals(chatId).delete());
  }
}
