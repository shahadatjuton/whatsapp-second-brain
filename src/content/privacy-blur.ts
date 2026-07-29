import { useUIStore } from '@/state/ui.store';

/**
 * Privacy screen: blur WhatsApp's own content (contact names, messages, images)
 * and reveal each element only on hover. Useful for screen-sharing or working in
 * public. This is 100% local CSS injected into the page — no data is read.
 *
 * The blur is gated by classes toggled on `<html>` so enabling/disabling and the
 * per-category options are instant. Selectors target WhatsApp's stable structural
 * hooks (`#main`, `#pane-side`, `header`) rather than obfuscated class names.
 */

const STYLE_ID = 'wa-second-brain-privacy';

const CSS = `
.wsb-blur-names #main header span[title],
.wsb-blur-names #pane-side span[title]{filter:blur(5px)!important;transition:filter .12s ease;}
.wsb-blur-names #main header span[title]:hover,
.wsb-blur-names #pane-side span[title]:hover{filter:none!important;}

.wsb-blur-messages #main .copyable-text,
.wsb-blur-messages #main span.selectable-text{filter:blur(5px)!important;transition:filter .12s ease;}
.wsb-blur-messages #main .copyable-text:hover,
.wsb-blur-messages #main span.selectable-text:hover{filter:none!important;}

.wsb-blur-media #main img,
.wsb-blur-media #pane-side img{filter:blur(12px)!important;transition:filter .12s ease;}
.wsb-blur-media #main img:hover,
.wsb-blur-media #pane-side img:hover{filter:none!important;}
`;

function ensureStyle(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS;
  (document.head ?? document.documentElement).appendChild(style);
}

function applyClasses(): void {
  const state = useUIStore.getState();
  const root = document.documentElement.classList;
  root.toggle('wsb-blur-names', state.blurEnabled && state.blurNames);
  root.toggle('wsb-blur-messages', state.blurEnabled && state.blurMessages);
  root.toggle('wsb-blur-media', state.blurEnabled && state.blurMedia);
}

/** Start applying the privacy blur; returns a teardown function. */
export function startPrivacyBlur(): () => void {
  ensureStyle();
  applyClasses();
  const unsubscribe = useUIStore.subscribe(applyClasses);

  return () => {
    unsubscribe();
    document.getElementById(STYLE_ID)?.remove();
    document.documentElement.classList.remove(
      'wsb-blur-names',
      'wsb-blur-messages',
      'wsb-blur-media',
    );
  };
}
