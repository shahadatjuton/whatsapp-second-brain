import type { ReactNode } from 'react';
import { cn } from './cn';

export interface BadgeProps {
  children: ReactNode;
  className?: string;
}

/** Small pill label (used for todo priorities). */
export function Badge({ children, className }: BadgeProps): JSX.Element {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
        className,
      )}
    >
      {children}
    </span>
  );
}
