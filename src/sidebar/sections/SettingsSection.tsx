import { ShieldCheck } from 'lucide-react';

/**
 * Settings section — placeholder shell. Export/import, delete-all, reset and
 * storage usage are implemented in Milestone 8. The privacy statement is shown
 * now because it is a core promise of the product.
 */
export function SettingsSection(): JSX.Element {
  return (
    <div className="p-4">
      <div className="flex items-start gap-3 rounded-card bg-brand/5 p-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden />
        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
          This extension stores everything locally inside your browser. No data is sent to any
          server.
        </p>
      </div>
      <p className="mt-4 text-center text-[11px] text-slate-400">
        More settings coming soon.
      </p>
    </div>
  );
}
