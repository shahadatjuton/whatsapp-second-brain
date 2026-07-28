import { useUIStore } from '@/state/ui.store';
import { isEnvelope } from '@/types/messages';
import { logger } from '@/utils/logger';
import { mountSidebar } from './mount';

/**
 * Content script entry point — runs in the WhatsApp Web page context.
 *
 * Milestone 3: mount the Shadow-DOM sidebar and respond to the popup's
 * "open sidebar" request. Chat detection (M4) and the full page↔background
 * bridge are layered on next.
 */
function bootstrap(): void {
  mountSidebar();

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
