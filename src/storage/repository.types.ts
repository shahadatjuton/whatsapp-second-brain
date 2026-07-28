import type { Result } from '@/utils/result';

/**
 * Generic persistence contract (SOLID: depend on this abstraction, not on
 * Dexie). Services and hooks program against these interfaces so the storage
 * engine could be swapped without touching feature code.
 */
export interface IRepository<T, K = string> {
  getAll(): Promise<Result<T[]>>;
  getById(id: K): Promise<Result<T | undefined>>;
  /** Insert or replace a fully-formed, validated entity. */
  put(entity: T): Promise<Result<T>>;
  /** Shallow-merge changes into an existing entity. */
  update(id: K, changes: Partial<T>): Promise<Result<T>>;
  delete(id: K): Promise<Result<void>>;
  clear(): Promise<Result<void>>;
}

/**
 * Repositories whose rows belong to a specific chat (notes, todos, reminders).
 */
export interface IChatScopedRepository<T, K = string> extends IRepository<T, K> {
  getByChatId(chatId: string): Promise<Result<T[]>>;
  deleteByChatId(chatId: string): Promise<Result<number>>;
}
