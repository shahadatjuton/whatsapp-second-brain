import { Brain } from 'lucide-react';
import pkg from '../../package.json';

/**
 * Extension popup. Milestone 1 renders a minimal, styled shell to validate the
 * React + Tailwind + Lucide pipeline. Full popup (open sidebar, settings
 * shortcut, storage usage) is implemented in Milestone 9.
 */
export function Popup(): JSX.Element {
  return (
    <div className="w-72 bg-surface-light p-5 font-sans text-slate-800">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-card bg-brand/10 text-brand">
          <Brain size={20} aria-hidden />
        </span>
        <div>
          <h1 className="text-sm font-semibold leading-tight">WhatsApp Second Brain</h1>
          <p className="text-xs text-slate-500">Private notes, todos & reminders</p>
        </div>
      </div>

      <p className="mt-4 rounded-card bg-surface-muted p-3 text-xs leading-relaxed text-slate-600">
        Open WhatsApp Web to use your second brain. Everything stays local in your browser.
      </p>

      <p className="mt-4 text-right text-[11px] text-slate-400">v{pkg.version}</p>
    </div>
  );
}
