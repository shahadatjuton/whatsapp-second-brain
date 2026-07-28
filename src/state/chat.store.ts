import { create } from 'zustand';
import type { ChatContext } from '@/types/models';

interface ChatState {
  /** The conversation currently open in WhatsApp, or `null` if none. */
  activeChat: ChatContext | null;
  setActiveChat: (chat: ChatContext | null) => void;
}

/**
 * Holds the active conversation. The ChatDetector (content script) writes to it
 * and the sidebar (same JS context) reads from it — this shared store IS the
 * content↔sidebar bridge, so no runtime messaging is needed between them.
 */
export const useChatStore = create<ChatState>((set) => ({
  activeChat: null,
  setActiveChat: (activeChat) => set({ activeChat }),
}));
