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
  // A WhatsApp JID is `<id>@<domain>` — e.g. 12..@c.us, ..@g.us, ..@lid,
  // ..@newsletter, ..@broadcast. We stay lenient about the domain so WhatsApp
  // changes don't break detection, but require a leading digit so message text
  // or email-like strings can never be mistaken for a JID.
  return /^\d[\w-]*@[\w.-]+$/.test(segment) ? segment : null;
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

/** The first parseable chat JID among the open chat's message elements. */
function readJid(main: Element): string | null {
  const nodes = main.querySelectorAll('[data-id]');
  for (const node of nodes) {
    const jid = parseJidFromDataId(node.getAttribute('data-id') ?? '');
    if (jid) return jid;
  }
  return null;
}

/**
 * Reads the conversation title from the chat header. Tries several shapes since
 * WhatsApp's markup shifts — but always within `#main header`, so it's the open
 * conversation's title (never a chat-list entry).
 */
const chatNameFromHeader: Strategy<string> = () => {
  const header = document.querySelector('#main header');
  if (!header) return null;
  const candidates = [
    header.querySelector<HTMLElement>('span[dir="auto"][title]'),
    header.querySelector<HTMLElement>('span[title]'),
    header.querySelector<HTMLElement>('span[dir="auto"]'),
  ];
  for (const element of candidates) {
    const title = element?.getAttribute('title')?.trim();
    if (title) return title;
    const text = element?.textContent?.trim();
    if (text && text.length > 0) return text;
  }
  return null;
};

/**
 * Diagnostic snapshot of what the detector currently sees — logged (throttled)
 * when a conversation is open but no id could be resolved, so detection issues
 * on a new WhatsApp build can be reported and fixed quickly.
 */
export function collectDetectionDiagnostics(): string {
  const main = getMain();
  if (!main) return 'no #main element';
  const nodes = main.querySelectorAll('[data-id]');
  const sample = nodes.length > 0 ? nodes[0]?.getAttribute('data-id') : null;
  const headerTitle = document.querySelector('#main header span[title]')?.getAttribute('title');
  return `[data-id] nodes: ${nodes.length}, sample: ${sample ?? 'none'}, header title: ${headerTitle ?? 'none'}`;
}

/**
 * Resolve the currently open conversation, or `null` when it can't be
 * identified at all.
 *
 * The stable JID is preferred (globally unique). When it can't be parsed — for
 * example if WhatsApp's `data-id` format differs from what we recognise — we
 * fall back to a `name:`-prefixed id from the header title so the chat is still
 * usable. As long as the detection code stays stable, a given chat resolves the
 * same way every time, so notes never get split across ids.
 */
export function resolveChatContext(): ChatContext | null {
  const main = getMain();
  if (!main) return null;

  const name = chatNameFromHeader();
  const jid = readJid(main);

  if (jid) return { chatId: jid, chatName: name ?? deriveDisplayName(jid) };
  if (name) return { chatId: `name:${name}`, chatName: name };
  return null;
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
