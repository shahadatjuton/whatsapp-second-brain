import { cn } from './cn';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

interface SelectProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: ReadonlyArray<SelectOption<T>>;
  className?: string;
  'aria-label': string;
}

/** Typed wrapper around a native `<select>` — keeps values strongly typed. */
export function Select<T extends string>({
  value,
  onChange,
  options,
  className,
  'aria-label': ariaLabel,
}: SelectProps<T>): JSX.Element {
  return (
    <select
      aria-label={ariaLabel}
      value={value}
      onChange={(event) => onChange(event.target.value as T)}
      className={cn(
        'h-9 cursor-pointer rounded-card bg-surface-muted px-2 text-sm text-slate-700',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand',
        'dark:bg-surface-dark-muted dark:text-slate-200',
        className,
      )}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
