import { AnimatePresence } from 'framer-motion';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useUIStore } from '@/state/ui.store';
import { Launcher } from './layout/Launcher';
import { Sidebar } from './layout/Sidebar';

/**
 * Root of the injected UI. Owns the theme wrapper (Tailwind `dark` class scoped
 * to the shadow tree) and toggles between the collapsed launcher and the full
 * panel with an exit animation.
 */
export function SidebarApp(): JSX.Element {
  const theme = useUIStore((state) => state.theme);
  const collapsed = useUIStore((state) => state.collapsed);

  return (
    <div className={theme === 'dark' ? 'dark' : undefined}>
      <ErrorBoundary label="sidebar">
        <AnimatePresence mode="wait" initial={false}>
          {collapsed ? <Launcher key="launcher" /> : <Sidebar key="sidebar" />}
        </AnimatePresence>
      </ErrorBoundary>
    </div>
  );
}
