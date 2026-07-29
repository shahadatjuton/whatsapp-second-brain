import type { Section } from '@/types/enums';
import { MESSAGE_SOURCE, type MessageEnvelope, type OpenSidebarMessage } from '@/types/messages';

const WHATSAPP_URL_MATCH = 'https://web.whatsapp.com/*';
const WHATSAPP_URL = 'https://web.whatsapp.com/';

/**
 * Focus an existing WhatsApp Web tab (or open one) and expand the sidebar,
 * optionally on a specific section. Shared by the popup and the background
 * notification handler. Uses only the existing host permission.
 */
export async function focusWhatsAppAndOpenSidebar(section?: Section): Promise<void> {
  const message: OpenSidebarMessage = section
    ? { type: 'OPEN_SIDEBAR', section }
    : { type: 'OPEN_SIDEBAR' };
  const envelope: MessageEnvelope = { source: MESSAGE_SOURCE, message };

  let tabs: chrome.tabs.Tab[] = [];
  try {
    tabs = await chrome.tabs.query({ url: WHATSAPP_URL_MATCH });
  } catch {
    tabs = [];
  }

  const target = tabs.find((tab) => tab.id != null);
  if (target?.id != null) {
    try {
      await chrome.tabs.update(target.id, { active: true });
      if (target.windowId != null) {
        await chrome.windows.update(target.windowId, { focused: true });
      }
      await chrome.tabs.sendMessage(target.id, envelope);
    } catch {
      // Content script may not be ready — focusing the tab is still useful.
    }
    return;
  }

  try {
    await chrome.tabs.create({ url: WHATSAPP_URL });
  } catch {
    // Nothing more we can do.
  }
}
