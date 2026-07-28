import type { StateStorage } from 'zustand/middleware';
import { isExtensionContextValid } from '@/utils/extension';

/**
 * Zustand persistence adapter backed by `chrome.storage.local`.
 *
 * We deliberately avoid the page's `localStorage` (that belongs to WhatsApp Web
 * and must not be polluted). `chrome.storage.local` is extension-private,
 * survives reloads, and is shared across the popup and content-script contexts.
 *
 * Every method is guarded: once the content script is orphaned (extension
 * reloaded), `chrome.storage.*` throws "Extension context invalidated", so we
 * degrade to a no-op instead of crashing the UI.
 */
export const chromeStorage: StateStorage = {
  async getItem(name) {
    if (!isExtensionContextValid()) return null;
    try {
      const result = await chrome.storage.local.get(name);
      const value = result[name];
      return typeof value === 'string' ? value : null;
    } catch {
      return null;
    }
  },
  async setItem(name, value) {
    if (!isExtensionContextValid()) return;
    try {
      await chrome.storage.local.set({ [name]: value });
    } catch {
      // Orphaned context — preferences simply won't persist until reload.
    }
  },
  async removeItem(name) {
    if (!isExtensionContextValid()) return;
    try {
      await chrome.storage.local.remove(name);
    } catch {
      // Orphaned context — safe to ignore.
    }
  },
};
