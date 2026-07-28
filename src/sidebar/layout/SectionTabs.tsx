import { Bell, CheckSquare, Settings, StickyNote, type LucideIcon } from 'lucide-react';
import { cn } from '@/components/ui/cn';
import type { Section } from '@/types/enums';
import { useUIStore } from '@/state/ui.store';

const TABS: ReadonlyArray<{ id: Section; label: string; icon: LucideIcon }> = [
  { id: 'notes', label: 'Notes', icon: StickyNote },
  { id: 'todos', label: 'Todos', icon: CheckSquare },
  { id: 'reminders', label: 'Reminders', icon: Bell },
  { id: 'settings', label: 'Settings', icon: Settings },
];

/** Bottom-anchored, icon+label tab bar to switch sidebar sections. */
export function SectionTabs(): JSX.Element {
  const activeSection = useUIStore((state) => state.activeSection);
  const setActiveSection = useUIStore((state) => state.setActiveSection);

  return (
    <nav
      aria-label="Sidebar sections"
      className="grid grid-cols-4 border-t border-black/5 dark:border-white/10"
    >
      {TABS.map(({ id, label, icon: Icon }) => {
        const isActive = id === activeSection;
        return (
          <button
            key={id}
            type="button"
            aria-current={isActive ? 'page' : undefined}
            onClick={() => setActiveSection(id)}
            className={cn(
              'flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand',
              isActive
                ? 'text-brand'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200',
            )}
          >
            <Icon size={18} aria-hidden />
            {label}
          </button>
        );
      })}
    </nav>
  );
}
