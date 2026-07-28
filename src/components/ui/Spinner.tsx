import { Loader2 } from 'lucide-react';
import { cn } from './cn';

export interface SpinnerProps {
  className?: string;
  label?: string;
}

/** Accessible loading spinner. */
export function Spinner({ className, label = 'Loading' }: SpinnerProps): JSX.Element {
  return (
    <span role="status" aria-live="polite" className={cn('inline-flex text-brand', className)}>
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  );
}
