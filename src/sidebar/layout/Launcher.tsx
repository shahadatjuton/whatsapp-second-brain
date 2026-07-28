import { motion } from 'framer-motion';
import { Brain } from 'lucide-react';
import { useUIStore } from '@/state/ui.store';

/**
 * Floating pill shown when the sidebar is collapsed. Clicking it expands the
 * panel. Anchored to the right edge, vertically centred, above WhatsApp's UI.
 */
export function Launcher(): JSX.Element {
  const setCollapsed = useUIStore((state) => state.setCollapsed);

  return (
    <motion.button
      type="button"
      aria-label="Open Second Brain"
      title="Open Second Brain"
      onClick={() => setCollapsed(false)}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="fixed right-4 top-1/2 z-[2147483000] flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-brand text-white shadow-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
    >
      <Brain size={22} aria-hidden />
    </motion.button>
  );
}
