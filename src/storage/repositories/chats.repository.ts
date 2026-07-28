import type { Chat } from '@/types/models';
import { tryCatch, type Result } from '@/utils/result';
import { db } from '../db';
import { chatSchema } from '../schemas';
import { BaseRepository } from './base.repository';

/** Persistence for chat metadata (one row per WhatsApp conversation seen). */
export class ChatsRepository extends BaseRepository<Chat> {
  public constructor() {
    super(db.chats, chatSchema);
  }

  /** Chats ordered by most recently opened first. */
  public async getRecent(): Promise<Result<Chat[]>> {
    return tryCatch(db.chats.orderBy('lastOpened').reverse().toArray());
  }
}

export const chatsRepository = new ChatsRepository();
