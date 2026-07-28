import type { ChatContext } from '@/types/models';

/** Called whenever the active conversation changes (or clears to `null`). */
export type ChatChangeHandler = (context: ChatContext | null) => void;

/**
 * A detection strategy resolves a single field from the DOM, returning `null`
 * when it cannot. Strategies are tried in priority order so the detector stays
 * resilient to WhatsApp's frequent markup changes — if one breaks, the next
 * takes over and we only fix one small function.
 */
export type Strategy<T> = () => T | null;

export type { ChatContext };
