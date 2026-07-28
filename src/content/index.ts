import { chatsService } from '@/services/chats.service';
import { useChatStore } from '@/state/chat.store';
import { useUIStore } from '@/state/ui.store';
import { isEnvelope } from '@/types/messages';
import { logger } from '@/utils/logger';
import { sendToBackground } from './bridge';
import { ChatDetector } from './chat-detector/ChatDetector';
import { mountSidebar } from './mount';

/**
 * Content script entry point — runs in the WhatsApp Web page context.
 *
 * Milestone 4: mount the sidebar, then run the ChatDetector. On every chat
 * change we (1) update the shared chat store the sidebar reads, (2) upsert the
 * chat row in IndexedDB, and (3) notify the background worker.
 */
function bootstrap(): void {
  mountSidebar();

  const detector = new ChatDetector((context) => {
    useChatStore.getState().setActiveChat(context);
    if (context) {
      void chatsService.upsert(context);
      sendToBackground({ type: 'CHAT_OPENED', payload: context });
    }
  });
  detector.start();

  // Popup → content: expand the sidebar on request.
  chrome.runtime.onMessage.addListener((raw) => {
    if (isEnvelope(raw) && raw.message.type === 'OPEN_SIDEBAR') {
      useUIStore.getState().setCollapsed(false);
    }
  });

  logger.info('Content script initialised on WhatsApp Web.');
}

bootstrap();

export {};
