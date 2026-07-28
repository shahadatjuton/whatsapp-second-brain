import type { Table } from 'dexie';
import type { ZodType } from 'zod';
import { err, ok, tryCatch, type Result } from '@/utils/result';
import type { IRepository } from '../repository.types';

/**
 * Abstract Dexie-backed repository implementing the shared CRUD surface once.
 * Concrete repositories only declare their table, validation schema and key
 * accessor — plus any entity-specific queries.
 *
 * Every method returns a `Result` (never throws), so IndexedDB failures degrade
 * gracefully instead of crashing the UI.
 */
export abstract class BaseRepository<T, K extends string = string>
  implements IRepository<T, K>
{
  protected constructor(
    protected readonly table: Table<T, K>,
    protected readonly schema: ZodType<T>,
  ) {}

  public async getAll(): Promise<Result<T[]>> {
    return tryCatch(this.table.toArray());
  }

  public async getById(id: K): Promise<Result<T | undefined>> {
    return tryCatch(this.table.get(id));
  }

  public async put(entity: T): Promise<Result<T>> {
    const parsed = this.schema.safeParse(entity);
    if (!parsed.success) {
      return err(new Error(`Validation failed: ${parsed.error.message}`));
    }
    const value = parsed.data;
    // Tables use inbound primary keys, so no separate key argument is passed.
    const result = await tryCatch(this.table.put(value));
    return result.ok ? ok(value) : result;
  }

  public async update(id: K, changes: Partial<T>): Promise<Result<T>> {
    const current = await this.getById(id);
    if (!current.ok) return current;
    if (!current.value) {
      return err(new Error(`Cannot update: entity "${id}" not found.`));
    }
    return this.put({ ...current.value, ...changes });
  }

  public async delete(id: K): Promise<Result<void>> {
    return tryCatch(this.table.delete(id));
  }

  public async clear(): Promise<Result<void>> {
    return tryCatch(this.table.clear());
  }
}
