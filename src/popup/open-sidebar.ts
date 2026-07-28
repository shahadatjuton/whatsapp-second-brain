import type { Section } from '@/types/enums';
import { MESSAGE_SOURCE, type MessageEnvelope, type OpenSidebarMessage } from '@/types/messages';

const WHATSAPP_URL_MATCH = 'https://web.whatsapp.com/*';
const WHATSAPP_URL = 'https://web.whatsapp.com/';

/**
 * Open (or focus) WhatsApp Web and expand the sidebar, optionally on a specific
 * section. Uses only the existing host permission — no `tabs` permission needed
 * to query/message a URL we already have host access to.
 */
export async function openSidebar(section?: Section): Promise<void> {
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
      // Content script may not be ready yet — focusing the tab is still useful.
    }
  } else {
    try {
      await chrome.tabs.create({ url: WHATSAPP_URL });
    } catch {
      // Nothing more we can do from the popup.
    }
  }

  window.close();
}
