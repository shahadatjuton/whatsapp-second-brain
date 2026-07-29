import { logger } from '@/utils/logger';
import { debounce, type Debounced } from '@/utils/debounce';
import {
  collectDetectionDiagnostics,
  decideChatChange,
  isConversationOpen,
  resolveChatContext,
} from './strategies';
import type { ChatChangeHandler } from './types';

const UNRESOLVED_WARN_INTERVAL_MS = 5000;
/**
 * How long `#main` must be continuously absent before we treat it as "no chat
 * open". WhatsApp briefly remounts `#main` when switching conversations; without
 * this grace the active chat would flicker away and its data disappear.
 */
const NO_CHAT_GRACE_MS = 900;

const DEFAULT_DEBOUNCE_MS = 250;
/**
 * Safety-net poll interval. WhatsApp mutates its DOM almost continuously, which
 * can starve a trailing-only debounce (it keeps resetting and never fires). A
 * low-frequency poll guarantees chat switches are still detected; it is cheap
 * because `detect()` short-circuits when the resolved chatId is unchanged.
 */
const POLL_INTERVAL_MS = 1500;

/** Observe the WhatsApp app root rather than all of `document.body` to cut noise. */
function getObserveRoot(): Element {
  return document.querySelector('#app') ?? document.body;
}

/**
 * Watches WhatsApp Web for conversation changes and emits a normalized
 * `ChatContext`. A debounced MutationObserver (scoped to the app root) coalesces
 * WhatsApp's constant DOM churn, backed by a periodic poll so detection can never
 * be starved. The handler fires only when the resolved `chatId` actually changes.
 */
export class ChatDetector {
  private observer: MutationObserver | null = null;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private lastChatId: string | null = null;
  private lastUnresolvedWarn = 0;
  private noChatSince: number | null = null;
  private readonly scan: Debounced<[]>;

  public constructor(
    private readonly onChange: ChatChangeHandler,
    debounceMs: number = DEFAULT_DEBOUNCE_MS,
  ) {
    this.scan = debounce(() => this.detect(), debounceMs);
  }

  /** Begin observing. Emits the initial context synchronously. */
  public start(): void {
    if (this.observer) return;
    this.detect();
    this.observer = new MutationObserver(() => this.scan());
    this.observer.observe(getObserveRoot(), { childList: true, subtree: true });
    this.pollTimer = setInterval(() => this.detect(), POLL_INTERVAL_MS);
  }

  public stop(): void {
    this.scan.cancel();
    this.observer?.disconnect();
    this.observer = null;
    if (this.pollTimer !== null) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    this.lastChatId = null;
    this.noChatSince = null;
  }

  private detect(): void {
    const conversationOpen = isConversationOpen();

    // Tolerate a brief absence of `#main` (WhatsApp remounts it on chat switch)
    // so the active chat — and its notes/todos — doesn't flicker away.
    if (!conversationOpen) {
      if (this.noChatSince === null) this.noChatSince = Date.now();
      if (Date.now() - this.noChatSince < NO_CHAT_GRACE_MS) return;
    } else {
      this.noChatSince = null;
    }

    const context = resolveChatContext();

    // A chat is open but we couldn't identify it — surface diagnostics
    // (throttled) so a broken selector on a new WhatsApp build is easy to spot.
    if (conversationOpen && !context) {
      const now = Date.now();
      if (now - this.lastUnresolvedWarn > UNRESOLVED_WARN_INTERVAL_MS) {
        this.lastUnresolvedWarn = now;
        logger.warn('Could not resolve the open chat.', collectDetectionDiagnostics());
      }
    }

    const change = decideChatChange({ conversationOpen, context, lastChatId: this.lastChatId });
    if (!change) return;
    this.lastChatId = change.nextChatId;
    if (change.emit) {
      logger.info('Active chat:', change.emit.chatId, `(${change.emit.chatName})`);
    }
    this.onChange(change.emit);
  }
}
