import { useLiveQuery } from 'dexie-react-hooks';
import { getStorageUsage, type StorageUsage } from '@/services/storage-usage.service';
import type { Result } from '@/utils/result';

/** Live storage usage — recomputes whenever any table changes. */
export function useStorageUsage(): Result<StorageUsage> | undefined {
  return useLiveQuery(() => getStorageUsage(), []);
}
