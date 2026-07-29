import { chatsService } from '@/services/chats.service';
import { useChatStore } from '@/state/chat.store';
import { useUIStore } from '@/state/ui.store';
import { isEnvelope } from '@/types/messages';
import { isExtensionContextValid } from '@/utils/extension';
import { logger } from '@/utils/logger';
import { sendToBackground } from './bridge';
import { ChatDetector } from './chat-detector/ChatDetector';
import { mountSidebar } from './mount';
import { startPrivacyBlur } from './privacy-blur';
import { startReminderSync } from './reminder-sync';
import { startStatsSync } from './stats-sync';

const CONTEXT_CHECK_INTERVAL_MS = 1000;

/**
 * Content script entry point — runs in the WhatsApp Web page context.
 *
 * Mounts the sidebar and runs the ChatDetector. On every chat change we
 * (1) update the shared chat store the sidebar reads, (2) upsert the chat row in
 * IndexedDB, and (3) notify the background worker.
 *
 * A watchdog tears everything down if the extension context is invalidated
 * (extension reloaded/updated), so the orphaned script stops touching `chrome.*`
 * and no longer throws "Extension context invalidated". The user just needs to
 * reload the WhatsApp tab to get a fresh script.
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

  // Mirror reminders to the background so notifications fire even when collapsed.
  const stopReminderSync = startReminderSync();
  // Mirror storage usage so the popup can display it.
  const stopStatsSync = startStatsSync();
  // Privacy screen: blur WhatsApp content until hover (opt-in).
  const stopPrivacyBlur = startPrivacyBlur();

  // Popup → content: expand the sidebar (optionally on a specific section).
  const handleMessage = (raw: unknown): void => {
    if (isEnvelope(raw) && raw.message.type === 'OPEN_SIDEBAR') {
      const ui = useUIStore.getState();
      ui.setCollapsed(false);
      if (raw.message.section) ui.setActiveSection(raw.message.section);
    }
  };
  chrome.runtime.onMessage.addListener(handleMessage);

  const watchdog = setInterval(() => {
    if (isExtensionContextValid()) return;
    clearInterval(watchdog);
    detector.stop();
    stopReminderSync();
    stopStatsSync();
    stopPrivacyBlur();
    try {
      chrome.runtime.onMessage.removeListener(handleMessage);
    } catch {
      // Context already gone — nothing to clean up.
    }
    logger.info('Extension context invalidated — content script stopped. Reload the tab to reconnect.');
  }, CONTEXT_CHECK_INTERVAL_MS);

  logger.info('Content script initialised on WhatsApp Web.');
}

bootstrap();

export {};
