import { useEffect, useState } from 'react';
import { Bell, Brain, CheckSquare, PanelRight, Settings, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { readStats, type StorageUsage } from '@/shared/stats';
import { formatBytes } from '@/utils/format';
import { openSidebar } from './open-sidebar';
import pkg from '../../package.json';

const USAGE_ROWS = [
  { key: 'notes', label: 'Notes', icon: StickyNote },
  { key: 'todos', label: 'Todos', icon: CheckSquare },
  { key: 'reminders', label: 'Reminders', icon: Bell },
] as const;

/** Extension popup: brand, quick actions, storage usage and version. */
export function Popup(): JSX.Element {
  const [stats, setStats] = useState<StorageUsage | null | undefined>(undefined);

  useEffect(() => {
    void readStats().then(setStats);
  }, []);

  return (
    <div className="w-72 bg-surface-light p-4 font-sans text-slate-800">
      <header className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-card bg-brand/10 text-brand">
          <Brain size={20} aria-hidden />
        </span>
        <div className="leading-tight">
          <h1 className="text-sm font-semibold">WhatsApp Second Brain</h1>
          <p className="text-xs text-slate-500">Private notes, todos &amp; reminders</p>
        </div>
      </header>

      <div className="mt-4 flex flex-col gap-2">
        <Button size="md" onClick={() => void openSidebar()}>
          <PanelRight size={16} aria-hidden />
          Open sidebar
        </Button>
        <Button variant="secondary" size="sm" onClick={() => void openSidebar('settings')}>
          <Settings size={15} aria-hidden />
          Settings
        </Button>
      </div>

      <section className="mt-4 rounded-card bg-surface-muted p-3">
        <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Storage usage
        </h2>
        {stats === undefined ? (
          <p className="text-xs text-slate-400">Loading…</p>
        ) : stats === null || stats.counts.total === 0 ? (
          <p className="text-xs leading-relaxed text-slate-500">
            Open WhatsApp Web and start adding notes to see your usage here.
          </p>
        ) : (
          <dl className="space-y-1 text-xs text-slate-600">
            {USAGE_ROWS.map(({ key, label, icon: Icon }) => (
              <div key={key} className="flex items-center justify-between">
                <dt className="flex items-center gap-1.5">
                  <Icon size={13} className="text-slate-400" aria-hidden />
                  {label}
                </dt>
                <dd className="font-medium text-slate-700">{stats.counts[key]}</dd>
              </div>
            ))}
            {stats.bytes != null ? (
              <div className="flex justify-between border-t border-black/5 pt-1 font-medium text-slate-700">
                <dt>Approx. size</dt>
                <dd>{formatBytes(stats.bytes)}</dd>
              </div>
            ) : null}
          </dl>
        )}
      </section>

      <p className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
        <span>100% local · no tracking</span>
        <span>v{pkg.version}</span>
      </p>
    </div>
  );
}
