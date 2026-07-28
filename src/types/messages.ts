import type { ChatContext } from './models';

/**
 * Typed, discriminated-union message protocol used across the extension.
 *
 * - Content ↔ Background : `chrome.runtime` messaging.
 * - Content ↔ Sidebar   : in-page bridge (both live on the WhatsApp Web page).
 *
 * Keeping every cross-context message in one union means the compiler enforces
 * exhaustive handling and prevents stringly-typed drift.
 */

export const MESSAGE_SOURCE = 'wa-second-brain' as const;

/** Popup → Content: expand/toggle the injected sidebar. */
export interface OpenSidebarMessage {
  type: 'OPEN_SIDEBAR';
}

/** ChatDetector (Content) → Sidebar: the active conversation changed. */
export interface ChatChangedMessage {
  type: 'CHAT_CHANGED';
  payload: ChatContext;
}

/** Content → Background: a chat was opened (for bookkeeping / future use). */
export interface ChatOpenedMessage {
  type: 'CHAT_OPENED';
  payload: ChatContext;
}

/** Sidebar → Background: reminders changed; re-evaluate scheduling. */
export interface RescheduleRemindersMessage {
  type: 'RESCHEDULE_REMINDERS';
}

export type ExtensionMessage =
  | OpenSidebarMessage
  | ChatChangedMessage
  | ChatOpenedMessage
  | RescheduleRemindersMessage;

/** Envelope wrapping every message so we can safely filter foreign messages. */
export interface MessageEnvelope<T extends ExtensionMessage = ExtensionMessage> {
  source: typeof MESSAGE_SOURCE;
  message: T;
}

export function isEnvelope(value: unknown): value is MessageEnvelope {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { source?: unknown }).source === MESSAGE_SOURCE
  );
}
