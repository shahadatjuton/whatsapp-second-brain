import type { ChatContext } from '@/types/models';
import type { Strategy } from './types';

/**
 * Chat detection strategies for WhatsApp Web.
 *
 * WhatsApp's DOM is obfuscated and changes often, so detection is split into
 * small, independently-replaceable strategies tried in priority order. The pure
 * string helpers (`parseJidFromDataId`, `deriveDisplayName`) are unit-tested;
 * the DOM readers are thin wrappers around them.
 */

/**
 * Extract the chat JID from a message element's `data-id`.
 *
 * WhatsApp message ids look like `false_919876543210@c.us_3EB0C767...` (or
 * `..._@g.us_...` for groups). The JID is the segment containing `@` and is
 * stable per conversation — the ideal identifier.
 */
export function parseJidFromDataId(dataId: string): string | null {
  if (!dataId) return null;
  const segment = dataId.split('_').find((part) => part.includes('@'));
  if (!segment) return null;
  // Basic sanity check: a WhatsApp JID ends in a known domain.
  return /@(c\.us|g\.us|lid|s\.whatsapp\.net)$/.test(segment) ? segment : null;
}

/** Human-friendly fallback name when the header title can't be read. */
export function deriveDisplayName(chatId: string): string {
  if (chatId.startsWith('name:')) return chatId.slice('name:'.length);
  const [local, domain] = chatId.split('@');
  if (domain?.startsWith('g.us')) return 'Group chat';
  return local ? `+${local}` : 'This chat';
}

function getMain(): Element | null {
  return document.querySelector('#main');
}

/** Priority 1: JID parsed from any rendered message in the open chat. */
const chatIdFromMessages: Strategy<string> = () => {
  const main = getMain();
  if (!main) return null;
  const nodes = main.querySelectorAll('[data-id]');
  for (const node of nodes) {
    const jid = parseJidFromDataId(node.getAttribute('data-id') ?? '');
    if (jid) return jid;
  }
  return null;
};

/** Reads the conversation title from the chat header. */
const chatNameFromHeader: Strategy<string> = () => {
  const header = document.querySelector('#main header');
  if (!header) return null;
  const titled = header.querySelector<HTMLElement>('span[title]');
  const title = titled?.getAttribute('title')?.trim();
  if (title) return title;
  const text = titled?.textContent?.trim();
  return text && text.length > 0 ? text : null;
};

/**
 * Priority 2 (fallback): a `name:`-prefixed id derived from the header title,
 * used only when no JID is available. Prefixed so it can never collide with a
 * real JID.
 */
const chatIdFromHeaderName: Strategy<string> = () => {
  const name = chatNameFromHeader();
  return name ? `name:${name}` : null;
};

const ID_STRATEGIES: ReadonlyArray<Strategy<string>> = [chatIdFromMessages, chatIdFromHeaderName];
const NAME_STRATEGIES: ReadonlyArray<Strategy<string>> = [chatNameFromHeader];

function firstNonNull<T>(strategies: ReadonlyArray<Strategy<T>>): T | null {
  for (const strategy of strategies) {
    const value = strategy();
    if (value !== null) return value;
  }
  return null;
}

/**
 * Resolve the currently open conversation, or `null` when no chat is open
 * (e.g. the "start page"). A chat requires an id; the name falls back to a
 * derived label.
 */
export function resolveChatContext(): ChatContext | null {
  const chatId = firstNonNull(ID_STRATEGIES);
  if (!chatId) return null;
  const chatName = firstNonNull(NAME_STRATEGIES) ?? deriveDisplayName(chatId);
  return { chatId, chatName };
}

/**
 * Is a conversation currently open? WhatsApp mounts the `#main` pane only when a
 * chat is open; on the intro/landing screen it is absent. This is the reliable
 * "no chat" signal — far more stable than whether our id/name selectors happen
 * to resolve on a given tick.
 */
export function isConversationOpen(): boolean {
  return document.querySelector('#main') != null;
}

export interface DetectionState {
  conversationOpen: boolean;
  context: ChatContext | null;
  lastChatId: string | null;
}

export interface DetectionChange {
  nextChatId: string | null;
  emit: ChatContext | null;
}

/**
 * Decide whether the active chat actually changed (pure — no DOM).
 *
 * Detection is deliberately *sticky*: if a conversation is open but our
 * selectors didn't resolve this tick (WhatsApp re-renders constantly), we return
 * `null` (no change) rather than clearing the active chat. The chat is only
 * cleared to `null` when the conversation pane is genuinely gone.
 */
export function decideChatChange({
  conversationOpen,
  context,
  lastChatId,
}: DetectionState): DetectionChange | null {
  if (!conversationOpen) {
    return lastChatId === null ? null : { nextChatId: null, emit: null };
  }
  if (!context) return null; // Transient resolution miss — keep the current chat.
  if (context.chatId === lastChatId) return null;
  return { nextChatId: context.chatId, emit: context };
}
