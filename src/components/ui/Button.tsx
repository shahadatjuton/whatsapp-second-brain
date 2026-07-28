import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from './cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-fg focus-visible:ring-brand',
  secondary:
    'bg-surface-muted text-slate-700 hover:bg-slate-200 focus-visible:ring-slate-400 dark:bg-surface-dark-muted dark:text-slate-100 dark:hover:bg-white/10',
  ghost:
    'bg-transparent text-slate-600 hover:bg-black/5 focus-visible:ring-slate-400 dark:text-slate-300 dark:hover:bg-white/10',
  danger: 'bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500',
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
};

/** Base button with variants. Fully keyboard-accessible with visible focus ring. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', className, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-card font-medium transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent',
        'disabled:pointer-events-none disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    />
  );
});
