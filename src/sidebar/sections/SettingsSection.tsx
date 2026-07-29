import { useRef, useState, type ReactNode } from 'react';
import {
  ChevronRight,
  Download,
  Moon,
  RotateCcw,
  ShieldCheck,
  Sun,
  Trash2,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Toggle } from '@/components/ui/Toggle';
import { cn } from '@/components/ui/cn';
import { useStorageUsage } from '@/hooks/useStorageUsage';
import {
  deleteAllData,
  exportAllData,
  importData,
} from '@/services/data-transfer.service';
import { useUIStore } from '@/state/ui.store';
import type { Theme } from '@/types/enums';
import { dayjs } from '@/utils/date';
import { downloadJson } from '@/utils/download';
import { formatBytes } from '@/utils/format';
import { AllDataBrowser, type DataTab } from './settings/AllDataBrowser';
import pkg from '../../../package.json';

type Status = { tone: 'success' | 'error'; message: string } | null;

const BROWSE_ROWS: ReadonlyArray<{ key: DataTab; label: string }> = [
  { key: 'notes', label: 'Notes' },
  { key: 'todos', label: 'Todos' },
  { key: 'reminders', label: 'Reminders' },
];

const THEME_OPTIONS: ReadonlyArray<{ value: Theme; label: string; icon: typeof Sun }> = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
];

function Group({ title, children }: { title: string; children: ReactNode }): JSX.Element {
  return (
    <section className="space-y-2">
      <h2 className="px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {title}
      </h2>
      <div className="rounded-card border border-black/5 bg-white p-3 shadow-soft dark:border-white/10 dark:bg-surface-dark-muted">
        {children}
      </div>
    </section>
  );
}

/** Settings: appearance, data export/import, delete-all, reset, storage, about. */
export function SettingsSection(): JSX.Element {
  const theme = useUIStore((state) => state.theme);
  const setTheme = useUIStore((state) => state.setTheme);
  const resetSettings = useUIStore((state) => state.resetSettings);
  const blurEnabled = useUIStore((state) => state.blurEnabled);
  const blurNames = useUIStore((state) => state.blurNames);
  const blurMessages = useUIStore((state) => state.blurMessages);
  const blurMedia = useUIStore((state) => state.blurMedia);
  const setBlurEnabled = useUIStore((state) => state.setBlurEnabled);
  const setBlurNames = useUIStore((state) => state.setBlurNames);
  const setBlurMessages = useUIStore((state) => state.setBlurMessages);
  const setBlurMedia = useUIStore((state) => state.setBlurMedia);
  const usage = useStorageUsage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [browserTab, setBrowserTab] = useState<DataTab | null>(null);

  const handleExport = async (): Promise<void> => {
    const result = await exportAllData();
    if (!result.ok) {
      setStatus({ tone: 'error', message: 'Export failed — storage unavailable.' });
      return;
    }
    downloadJson(`whatsapp-second-brain-${dayjs().format('YYYY-MM-DD')}.json`, result.value);
    setStatus({ tone: 'success', message: 'Backup exported to your downloads.' });
  };

  const handleImportFile = async (file: File): Promise<void> => {
    const text = await file.text();
    const result = await importData(text);
    if (!result.ok) {
      setStatus({ tone: 'error', message: result.error.message });
      return;
    }
    const { chats, notes, todos, reminders, skipped } = result.value;
    const imported = chats + notes + todos + reminders;
    setStatus({
      tone: 'success',
      message: `Imported ${imported} item${imported === 1 ? '' : 's'}${
        skipped ? ` (${skipped} skipped)` : ''
      }.`,
    });
  };

  const handleDeleteAll = async (): Promise<void> => {
    const result = await deleteAllData();
    setStatus(
      result.ok
        ? { tone: 'success', message: 'All data deleted.' }
        : { tone: 'error', message: 'Delete failed — please try again.' },
    );
  };

  return (
    <div className="flex flex-col gap-4 p-3">
      <Group title="Appearance">
        <div className="flex rounded-card bg-surface-muted p-0.5 dark:bg-surface-dark">
          {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              aria-pressed={theme === value}
              onClick={() => setTheme(value)}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-[0.7rem] py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                theme === value
                  ? 'bg-white text-slate-800 shadow-sm dark:bg-surface-dark-muted dark:text-slate-100'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200',
              )}
            >
              <Icon size={14} aria-hidden />
              {label}
            </button>
          ))}
        </div>
      </Group>

      <Group title="Privacy screen">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-100">
              Blur sensitive content
            </p>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Blurs WhatsApp names, messages &amp; images. Hover to reveal — great for
              screen-sharing.
            </p>
          </div>
          <Toggle
            checked={blurEnabled}
            onChange={setBlurEnabled}
            label="Blur sensitive content"
          />
        </div>

        {blurEnabled ? (
          <div className="mt-3 space-y-2.5 border-t border-black/5 pt-3 dark:border-white/10">
            {(
              [
                ['Contact names', blurNames, setBlurNames],
                ['Messages', blurMessages, setBlurMessages],
                ['Images & avatars', blurMedia, setBlurMedia],
              ] as const
            ).map(([label, value, setValue]) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-xs text-slate-600 dark:text-slate-300">{label}</span>
                <Toggle checked={value} onChange={setValue} label={label} />
              </div>
            ))}
          </div>
        ) : null}
      </Group>

      <Group title="Data">
        <div className="flex flex-col gap-2">
          <Button variant="secondary" size="sm" onClick={() => void handleExport()}>
            <Download size={15} aria-hidden />
            Export data
          </Button>
          <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Upload size={15} aria-hidden />
            Import data
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (file) void handleImportFile(file);
            }}
          />
          <Button variant="ghost" size="sm" onClick={() => setConfirmReset(true)}>
            <RotateCcw size={15} aria-hidden />
            Reset settings
          </Button>
          <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
            <Trash2 size={15} aria-hidden />
            Delete all data
          </Button>
        </div>

        {status ? (
          <p
            className={cn(
              'mt-2 text-center text-[11px]',
              status.tone === 'success' ? 'text-brand-fg' : 'text-red-500',
            )}
            role="status"
          >
            {status.message}
          </p>
        ) : null}
      </Group>

      <Group title="Storage">
        {usage && usage.ok ? (
          <div className="text-xs text-slate-600 dark:text-slate-300">
            {BROWSE_ROWS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setBrowserTab(key)}
                className="group flex w-full items-center justify-between rounded-lg px-1 py-1 transition-colors hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:hover:bg-white/5"
              >
                <span>{label}</span>
                <span className="flex items-center gap-1">
                  <span className="font-medium text-slate-700 dark:text-slate-100">
                    {usage.value.counts[key]}
                  </span>
                  <ChevronRight
                    size={13}
                    className="text-slate-300 transition-colors group-hover:text-slate-500"
                    aria-hidden
                  />
                </span>
              </button>
            ))}
            <div className="flex justify-between px-1 py-1">
              <span>Chats tracked</span>
              <span>{usage.value.counts.chats}</span>
            </div>
            {usage.value.bytes != null ? (
              <div className="mt-1 flex justify-between border-t border-black/5 px-1 pt-2 font-medium text-slate-700 dark:border-white/10 dark:text-slate-100">
                <span>Approx. size</span>
                <span>{formatBytes(usage.value.bytes)}</span>
              </div>
            ) : null}
            <p className="mt-2 px-1 text-[11px] text-slate-400">
              Tap a row to see every item and which chat it belongs to.
            </p>
          </div>
        ) : (
          <p className="text-xs text-slate-400">Calculating…</p>
        )}
      </Group>

      <Group title="About">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden />
          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            This extension stores everything locally inside your browser. No data is sent to any
            server.
          </p>
        </div>
        <p className="mt-3 text-right text-[11px] text-slate-400">v{pkg.version}</p>
      </Group>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete all data?"
        description="This permanently removes every note, todo and reminder across all chats. This cannot be undone."
        confirmLabel="Delete everything"
        danger
        onConfirm={() => void handleDeleteAll()}
        onClose={() => setConfirmDelete(false)}
      />
      <ConfirmDialog
        open={confirmReset}
        title="Reset settings?"
        description="Resets theme and sidebar width to their defaults. Your notes, todos and reminders are kept."
        confirmLabel="Reset"
        onConfirm={() => {
          resetSettings();
          setStatus({ tone: 'success', message: 'Settings reset to defaults.' });
        }}
        onClose={() => setConfirmReset(false)}
      />

      <AllDataBrowser
        open={browserTab !== null}
        initialTab={browserTab ?? 'notes'}
        onClose={() => setBrowserTab(null)}
      />
    </div>
  );
}
