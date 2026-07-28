import { debounce, type Debounced } from '@/utils/debounce';
import { resolveChatContext } from './strategies';
import type { ChatChangeHandler } from './types';

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
  }

  private detect(): void {
    const context = resolveChatContext();
    const chatId = context?.chatId ?? null;
    if (chatId === this.lastChatId) return;
    this.lastChatId = chatId;
    this.onChange(context);
  }
}
