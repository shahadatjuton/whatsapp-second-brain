import { motion } from 'framer-motion';
import { DatabaseGuard } from '@/components/DatabaseGuard';
import { useUIStore } from '@/state/ui.store';
import { ActiveChatBar } from './ActiveChatBar';
import { Header } from './Header';
import { ResizeHandle } from './ResizeHandle';
import { SectionOutlet } from './SectionOutlet';
import { SectionTabs } from './SectionTabs';

/**
 * The expanded sidebar panel: fixed to the right edge, full height, resizable.
 * Width is a runtime-measured value, so it is applied via `style` (the one
 * sanctioned exception to the Tailwind-only rule — dynamic dimensions).
 */
export function Sidebar(): JSX.Element {
  const width = useUIStore((state) => state.sidebarWidth);

  return (
    <motion.aside
      aria-label="WhatsApp Second Brain"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 380, damping: 40 }}
      style={{ width }}
      className="fixed right-0 top-0 z-[2147483000] flex h-screen flex-col overflow-hidden border-l border-black/5 bg-surface-light text-slate-800 shadow-soft dark:border-white/10 dark:bg-surface-dark dark:text-slate-100"
    >
      <ResizeHandle />
      <Header />
      <ActiveChatBar />
      <main className="flex-1 overflow-y-auto">
        <DatabaseGuard>
          <SectionOutletFromStore />
        </DatabaseGuard>
      </main>
      <SectionTabs />
    </motion.aside>
  );
}

/** Small connector so the outlet re-renders only when the active section changes. */
function SectionOutletFromStore(): JSX.Element {
  const section = useUIStore((state) => state.activeSection);
  return <SectionOutlet section={section} />;
}
