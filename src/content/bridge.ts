import { MESSAGE_SOURCE, type ExtensionMessage, type MessageEnvelope } from '@/types/messages';
import { logger } from '@/utils/logger';

/**
 * Content → Background messaging. Wraps every message in the shared envelope so
 * the receiver can reject foreign messages, and swallows the "receiving end
 * does not exist" rejection that occurs when the service worker is briefly
 * asleep (the message is best-effort; the background re-derives state as needed).
 */
export function sendToBackground(message: ExtensionMessage): void {
  const envelope: MessageEnvelope = { source: MESSAGE_SOURCE, message };
  chrome.runtime.sendMessage(envelope).catch((error: unknown) => {
    logger.warn('Background message not delivered (worker asleep?):', error);
  });
}
