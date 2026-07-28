import { MESSAGE_SOURCE, type ExtensionMessage, type MessageEnvelope } from '@/types/messages';
import { isExtensionContextValid } from '@/utils/extension';
import { logger } from '@/utils/logger';

/** Rejections/throws that are expected and harmless in normal operation. */
const BENIGN_ERRORS = [
  'Receiving end does not exist',
  'message port closed',
  'Extension context invalidated',
];

/**
 * Content → Background messaging. Wraps every message in the shared envelope so
 * the receiver can reject foreign messages.
 *
 * On an invalidated extension context (extension reloaded/updated),
 * `chrome.runtime.sendMessage` throws *synchronously* — before any promise
 * exists — so we guard first and wrap the call in try/catch, then also handle
 * the async rejection path.
 */
export function sendToBackground(message: ExtensionMessage): void {
  if (!isExtensionContextValid()) return;

  const envelope: MessageEnvelope = { source: MESSAGE_SOURCE, message };
  try {
    void chrome.runtime.sendMessage(envelope).catch((error: unknown) => {
      const text = error instanceof Error ? error.message : String(error);
      // Transient/expected (worker asleep or context torn down); surface only
      // genuinely unexpected failures.
      if (BENIGN_ERRORS.some((benign) => text.includes(benign))) return;
      logger.warn('Background message not delivered:', error);
    });
  } catch {
    // Context invalidated between the guard and the call — safe to ignore.
  }
}
