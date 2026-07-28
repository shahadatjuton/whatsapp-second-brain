import type { StateStorage } from 'zustand/middleware';

/**
 * Zustand persistence adapter backed by `chrome.storage.local`.
 *
 * We deliberately avoid the page's `localStorage` (that belongs to WhatsApp Web
 * and must not be polluted). `chrome.storage.local` is extension-private,
 * survives reloads, and is shared across the popup and content-script contexts.
 * The API is async — which zustand's `createJSONStorage` fully supports.
 */
export const chromeStorage: StateStorage = {
  async getItem(name) {
    const result = await chrome.storage.local.get(name);
    const value = result[name];
    return typeof value === 'string' ? value : null;
  },
  async setItem(name, value) {
    await chrome.storage.local.set({ [name]: value });
  },
  async removeItem(name) {
    await chrome.storage.local.remove(name);
  },
};
