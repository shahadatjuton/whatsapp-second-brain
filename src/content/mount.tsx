import { StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { SidebarApp } from '@/sidebar/SidebarApp';
import { logger } from '@/utils/logger';
// `?inline` returns the fully-compiled Tailwind CSS as a string so it can be
// injected into the shadow root — never touching WhatsApp's own styles.
import styles from '@/styles/tailwind.css?inline';

const HOST_ID = 'wa-second-brain-host';

interface MountedSidebar {
  unmount: () => void;
}

/**
 * Inject the sidebar into the page using Shadow DOM for complete style
 * isolation (our Tailwind cannot leak into WhatsApp, and WhatsApp's CSS cannot
 * bleed into us). Idempotent — safe to call more than once.
 */
export function mountSidebar(): MountedSidebar | null {
  if (document.getElementById(HOST_ID)) {
    return null;
  }

  const host = document.createElement('div');
  host.id = HOST_ID;
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = styles;
  shadow.appendChild(style);

  const mountPoint = document.createElement('div');
  shadow.appendChild(mountPoint);

  const root: Root = createRoot(mountPoint);
  root.render(
    <StrictMode>
      <SidebarApp />
    </StrictMode>,
  );

  logger.info('Sidebar mounted into shadow root.');

  return {
    unmount: () => {
      root.unmount();
      host.remove();
    },
  };
}
