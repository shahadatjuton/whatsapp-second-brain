/**
 * Detect whether the extension runtime is still valid from within a content
 * script.
 *
 * When the extension is reloaded, updated, or disabled, previously-injected
 * content scripts become "orphaned": any `chrome.*` call throws
 * "Extension context invalidated". Chrome clears `chrome.runtime.id` in that
 * state, so it is a cheap, synchronous validity probe.
 */
export function isExtensionContextValid(): boolean {
  try {
    return typeof chrome !== 'undefined' && chrome.runtime?.id != null;
  } catch {
    // Accessing chrome.runtime can itself throw once the context is gone.
    return false;
  }
}
