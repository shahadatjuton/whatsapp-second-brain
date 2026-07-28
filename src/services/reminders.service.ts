import type { Reminder } from '@/types/models';
import type { IChatScopedRepository } from '@/storage/repository.types';
import {
  remindersRepository,
  RemindersRepository,
} from '@/storage/repositories/reminders.repository';
import { createId } from '@/utils/id';
import type { Result } from '@/utils/result';

export interface CreateReminderInput {
  title: string;
  /** Fire time, epoch ms. */
  datetime: number;
}

/** Business logic for per-chat reminders. */
export class RemindersService {
  public constructor(
    private readonly repo: IChatScopedRepository<Reminder> = remindersRepository,
  ) {}

  public async listByChat(chatId: string): Promise<Result<Reminder[]>> {
    const result = await this.repo.getByChatId(chatId);
    if (!result.ok) return result;
    const sorted = [...result.value].sort((a, b) => a.datetime - b.datetime);
    return { ok: true, value: sorted };
  }

  public async create(chatId: string, input: CreateReminderInput): Promise<Result<Reminder>> {
    return this.repo.put({
      id: createId(),
      chatId,
      title: input.title,
      datetime: input.datetime,
      completed: false,
      createdAt: Date.now(),
    });
  }

  public async complete(id: string): Promise<Result<Reminder>> {
    return this.repo.update(id, { completed: true });
  }

  public async reschedule(id: string, datetime: number): Promise<Result<Reminder>> {
    return this.repo.update(id, { datetime, completed: false });
  }

  public async remove(id: string): Promise<Result<void>> {
    return this.repo.delete(id);
  }

  /** Due, not-completed reminders — for the background scan. */
  public async listDue(now: number = Date.now()): Promise<Result<Reminder[]>> {
    if (this.repo instanceof RemindersRepository) {
      return this.repo.getDue(now);
    }
    const all = await this.repo.getAll();
    if (!all.ok) return all;
    return { ok: true, value: all.value.filter((r) => !r.completed && r.datetime <= now) };
  }
}

export const remindersService = new RemindersService();
