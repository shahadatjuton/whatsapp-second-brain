import type { SelectOption } from '@/components/ui/Select';
import { PRIORITIES, type Priority } from '@/types/enums';

interface PriorityMeta {
  label: string;
  badgeClass: string;
  dotClass: string;
}

/** Presentation metadata for each todo priority. */
export const PRIORITY_META: Record<Priority, PriorityMeta> = {
  high: {
    label: 'High',
    badgeClass: 'bg-red-500/10 text-red-600 dark:text-red-400',
    dotClass: 'bg-red-500',
  },
  medium: {
    label: 'Medium',
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    dotClass: 'bg-amber-500',
  },
  low: {
    label: 'Low',
    badgeClass: 'bg-slate-400/10 text-slate-500 dark:text-slate-400',
    dotClass: 'bg-slate-400',
  },
};

/** Options for priority selects (high → low). */
export const PRIORITY_OPTIONS: ReadonlyArray<SelectOption<Priority>> = [...PRIORITIES]
  .reverse()
  .map((priority) => ({ value: priority, label: PRIORITY_META[priority].label }));
