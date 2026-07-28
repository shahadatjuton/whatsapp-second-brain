import { liveQuery, type Subscription } from 'dexie';
import { getStorageUsage } from '@/services/storage-usage.service';
import { db } from '@/storage/db';
import { writeStats } from '@/shared/stats';
import { debounce } from '@/utils/debounce';
import { isExtensionContextValid } from '@/utils/extension';
import { logger } from '@/utils/logger';

/**
 * Mirror storage usage into `chrome.storage.local` so the popup can read it.
 * Recomputation (which serializes all rows) is debounced so autosave keystrokes
 * don't trigger it repeatedly.
 */
export function startStatsSync(): () => void {
  const recompute = debounce(() => {
    if (!isExtensionContextValid()) return;
    void getStorageUsage().then((result) => {
      if (result.ok) void writeStats(result.value);
    });
  }, 1500);

  const subscription: Subscription = liveQuery(() =>
    Promise.all([db.chats.count(), db.notes.count(), db.todos.count(), db.reminders.count()]),
  ).subscribe({
    next: () => recompute(),
    error: (error) => logger.error('Stats sync failed:', error),
  });

  return () => {
    recompute.cancel();
    subscription.unsubscribe();
  };
}
