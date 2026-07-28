import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from './cn';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

/** Styled single-line text input. */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, type = 'text', ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        'h-9 w-full rounded-card bg-surface-muted px-3 text-sm text-slate-800 placeholder:text-slate-400',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand',
        'dark:bg-surface-dark-muted dark:text-slate-100',
        className,
      )}
      {...props}
    />
  );
});
