/**
 * Cross-context storage stats.
 *
 * Data lives in the page-origin IndexedDB, which the popup (extension origin)
 * can't read. The content script mirrors a small usage summary into
 * `chrome.storage.local` so the popup can display it — even from a fresh popup
 * with no WhatsApp tab focused.
 */

export const STATS_KEY = 'stats:usage';

export interface StorageUsage {
  counts: {
    chats: number;
    notes: number;
    todos: number;
    reminders: number;
    total: number;
  };
  /** Approximate serialized size of the user's data, in bytes. */
  bytes: number | null;
}

export async function readStats(): Promise<StorageUsage | null> {
  try {
    const result = await chrome.storage.local.get(STATS_KEY);
    return (result[STATS_KEY] as StorageUsage | undefined) ?? null;
  } catch {
    return null;
  }
}

export async function writeStats(usage: StorageUsage): Promise<void> {
  try {
    await chrome.storage.local.set({ [STATS_KEY]: usage });
  } catch {
    // Storage unavailable (orphaned context) — degrade to no-op.
  }
}
