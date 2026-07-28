import { debounce, type Debounced } from '@/utils/debounce';
import { resolveChatContext } from './strategies';
import type { ChatChangeHandler } from './types';

const DEFAULT_DEBOUNCE_MS = 250;

/**
 * Watches WhatsApp Web for conversation changes and emits a normalized
 * `ChatContext`. A single debounced MutationObserver coalesces WhatsApp's
 * constant DOM churn; the handler fires only when the resolved `chatId` actually
 * changes, so downstream consumers aren't spammed.
 */
export class ChatDetector {
  private observer: MutationObserver | null = null;
  private lastChatId: string | null = null;
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
    this.observer.observe(document.body, { childList: true, subtree: true });
  }

  public stop(): void {
    this.scan.cancel();
    this.observer?.disconnect();
    this.observer = null;
    this.lastChatId = null;
  }

  private detect(): void {
    const context = resolveChatContext();
    const chatId = context?.chatId ?? null;
    if (chatId === this.lastChatId) return;
    this.lastChatId = chatId;
    this.onChange(context);
  }
}
