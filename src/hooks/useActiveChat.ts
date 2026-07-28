import { useChatStore } from '@/state/chat.store';
import type { ChatContext } from '@/types/models';

/** Subscribe to the currently open WhatsApp conversation. */
export function useActiveChat(): ChatContext | null {
  return useChatStore((state) => state.activeChat);
}
