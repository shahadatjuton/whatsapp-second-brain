import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from './cn';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/** Reusable empty-state illustration used by every section (PRD "Empty States"). */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps): JSX.Element {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-6 py-12 text-center',
        className,
      )}
    >
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand/10 text-brand">
        <Icon className="h-7 w-7" aria-hidden />
      </span>
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-100">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-[15rem] text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
