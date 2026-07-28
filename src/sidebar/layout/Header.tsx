import { Brain, Moon, PanelRightClose, Sun } from 'lucide-react';
import { IconButton } from '@/components/ui/IconButton';
import { useUIStore } from '@/state/ui.store';

/** Sidebar header: brand, theme toggle and collapse control. */
export function Header(): JSX.Element {
  const theme = useUIStore((state) => state.theme);
  const toggleTheme = useUIStore((state) => state.toggleTheme);
  const setCollapsed = useUIStore((state) => state.setCollapsed);

  return (
    <header className="flex items-center justify-between border-b border-black/5 px-4 py-3 dark:border-white/10">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
          <Brain size={18} aria-hidden />
        </span>
        <div className="leading-tight">
          <h1 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Second Brain</h1>
          <p className="text-[11px] text-slate-400">Private &amp; local</p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <IconButton
          label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          onClick={toggleTheme}
        >
          {theme === 'dark' ? <Sun size={16} aria-hidden /> : <Moon size={16} aria-hidden />}
        </IconButton>
        <IconButton label="Collapse sidebar" onClick={() => setCollapsed(true)}>
          <PanelRightClose size={16} aria-hidden />
        </IconButton>
      </div>
    </header>
  );
}
