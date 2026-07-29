import type { Section } from '@/types/enums';
import { focusWhatsAppAndOpenSidebar } from '@/shared/whatsapp-tab';

/** Focus WhatsApp, open the sidebar (optionally on a section), then close the popup. */
export async function openSidebar(section?: Section): Promise<void> {
  await focusWhatsAppAndOpenSidebar(section);
  window.close();
}
