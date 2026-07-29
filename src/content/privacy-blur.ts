import { useUIStore } from '@/state/ui.store';
import { debounce, type Debounced } from '@/utils/debounce';

/**
 * Privacy screen: blur WhatsApp's own content (contact names, message text,
 * media, avatars) and optionally reveal each on hover. 100% local CSS injected
 * into the page — no data is read.
 *
 * Behaviour is driven by classes toggled on `<html>` from the shared UI store:
 *   wsb-b-names / wsb-b-text / wsb-b-media / wsb-b-avatars — which categories blur
 *   wsb-i-light / wsb-i-strong                             — strength (medium = default)
 *   wsb-reveal                                             — hover reveals
 *
 * In the chat list, both the contact name and the last-message preview are
 * `span[title]`, so a small tagger marks the first title span per row as the
 * name (`data-wsb="name"`) and the rest as previews (`data-wsb="preview"`) — the
 * name blurs under "names", the preview under "message text".
 */

const STYLE_ID = 'wa-second-brain-privacy';

const CSS = `
:root{--wsb-blur:6px;}
html.wsb-i-light{--wsb-blur:3px;}
html.wsb-i-strong{--wsb-blur:12px;}

.wsb-b-names #main header span[title],
.wsb-b-names #pane-side span[title][data-wsb="name"]{filter:blur(var(--wsb-blur));transition:filter .12s ease;}

.wsb-b-text #main .copyable-text,
.wsb-b-text #main span.selectable-text,
.wsb-b-text #pane-side span[title][data-wsb="preview"]{filter:blur(var(--wsb-blur));transition:filter .12s ease;}

.wsb-b-media #main img{filter:blur(calc(var(--wsb-blur) * 1.8));transition:filter .12s ease;}

.wsb-b-avatars #pane-side img,
.wsb-b-avatars #main header img{filter:blur(calc(var(--wsb-blur) * 1.8));transition:filter .12s ease;}

.wsb-reveal.wsb-b-names #main header span[title]:hover,
.wsb-reveal.wsb-b-names #pane-side span[title][data-wsb="name"]:hover,
.wsb-reveal.wsb-b-text #main .copyable-text:hover,
.wsb-reveal.wsb-b-text #main span.selectable-text:hover,
.wsb-reveal.wsb-b-text #pane-side span[title][data-wsb="preview"]:hover,
.wsb-reveal.wsb-b-media #main img:hover,
.wsb-reveal.wsb-b-avatars #pane-side img:hover,
.wsb-reveal.wsb-b-avatars #main header img:hover{filter:none;}
`;

function ensureStyle(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS;
  (document.head ?? document.documentElement).appendChild(style);
}

/** Mark each chat-list row's first title span as the name, the rest as previews. */
function tagPane(): void {
  const pane = document.querySelector('#pane-side');
  if (!pane) return;

  const rows = pane.querySelectorAll<HTMLElement>('[role="listitem"], [role="row"]');
  if (rows.length === 0) {
    // Structure unknown — treat every list title as a name so names still blur.
    pane.querySelectorAll<HTMLElement>('span[title]').forEach((el) => {
      el.dataset.wsb = 'name';
    });
    return;
  }

  rows.forEach((row) => {
    row.querySelectorAll<HTMLElement>('span[title]').forEach((el, index) => {
      el.dataset.wsb = index === 0 ? 'name' : 'preview';
    });
  });
}

let paneObserver: MutationObserver | null = null;
const retag: Debounced<[]> = debounce(() => tagPane(), 200);

function startTagging(): void {
  tagPane();
  if (paneObserver) return;
  const target = document.querySelector('#pane-side') ?? document.body;
  paneObserver = new MutationObserver(() => retag());
  paneObserver.observe(target, { childList: true, subtree: true });
}

function stopTagging(): void {
  retag.cancel();
  paneObserver?.disconnect();
  paneObserver = null;
}

function applyClasses(): void {
  const state = useUIStore.getState();
  const root = document.documentElement.classList;
  const on = state.blurEnabled;

  root.toggle('wsb-b-names', on && state.blurNames);
  root.toggle('wsb-b-text', on && state.blurText);
  root.toggle('wsb-b-media', on && state.blurMedia);
  root.toggle('wsb-b-avatars', on && state.blurAvatars);
  root.toggle('wsb-reveal', on && state.blurReveal);
  root.toggle('wsb-i-light', on && state.blurStrength === 'light');
  root.toggle('wsb-i-strong', on && state.blurStrength === 'strong');

  // Tagging is only needed to separate list names from previews.
  if (on && (state.blurNames || state.blurText)) startTagging();
  else stopTagging();
}

const ALL_CLASSES = [
  'wsb-b-names',
  'wsb-b-text',
  'wsb-b-media',
  'wsb-b-avatars',
  'wsb-i-light',
  'wsb-i-strong',
  'wsb-reveal',
];

/** Start applying the privacy blur; returns a teardown function. */
export function startPrivacyBlur(): () => void {
  ensureStyle();
  applyClasses();
  const unsubscribe = useUIStore.subscribe(applyClasses);

  return () => {
    unsubscribe();
    stopTagging();
    document.getElementById(STYLE_ID)?.remove();
    document.documentElement.classList.remove(...ALL_CLASSES);
  };
}
