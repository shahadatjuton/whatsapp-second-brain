import { useEffect, useRef, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/**
 * Lightweight modal. Rendered inline (no portal) so it stays inside the sidebar's
 * shadow root and keeps its styles; the overlay covers the panel. Escape and a
 * backdrop click both dismiss it (PRD UX).
 */
export function Modal({ open, onClose, title, children }: ModalProps): JSX.Element {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    // Focus lives in the shadow tree, so query the panel's root (ShadowRoot).
    const root = (panel?.getRootNode() ?? document) as Document | ShadowRoot;
    const previouslyFocused = root.activeElement as HTMLElement | null;

    const focusable = (): HTMLElement[] =>
      panel
        ? Array.from(
            panel.querySelectorAll<HTMLElement>(
              'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
            ),
          )
        : [];

    (focusable()[0] ?? panel)?.focus();

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusable();
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) {
        event.preventDefault();
        return;
      }
      if (event.shiftKey && root.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && root.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[2147483001] flex items-center justify-center bg-black/40 p-4"
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-xs rounded-card bg-surface-light p-4 shadow-soft outline-none dark:bg-surface-dark"
          >
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h2>
              <IconButton label="Close" onClick={onClose}>
                <X size={16} aria-hidden />
              </IconButton>
            </div>
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
