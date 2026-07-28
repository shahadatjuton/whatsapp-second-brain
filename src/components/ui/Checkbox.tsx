import { Check } from 'lucide-react';
import { cn } from './cn';

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Accessible label (required — checkboxes here are icon-only). */
  label: string;
  className?: string;
}

/** Accessible checkbox implemented as a toggle button with `role="checkbox"`. */
export function Checkbox({ checked, onChange, label, className }: CheckboxProps): JSX.Element {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1',
        checked
          ? 'border-brand bg-brand text-white'
          : 'border-slate-300 text-transparent hover:border-brand dark:border-slate-500',
        className,
      )}
    >
      <Check size={13} aria-hidden />
    </button>
  );
}
