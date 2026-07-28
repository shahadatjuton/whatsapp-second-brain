import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from './cn';

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

/** Styled, accessible textarea sharing the app's input look. */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'w-full resize-none rounded-card bg-transparent text-sm leading-relaxed text-slate-800 placeholder:text-slate-400',
        'focus:outline-none dark:text-slate-100',
        className,
      )}
      {...props}
    />
  );
});
