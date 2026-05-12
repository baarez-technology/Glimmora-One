import * as React from 'react';
import { cn } from '@/lib/utils';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          'flex h-10 w-full rounded-md border border-app bg-elev px-3 py-2 text-sm text-app',
          'placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 ring-accent ring-offset-2 ring-offset-transparent',
          'disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'flex min-h-[80px] w-full rounded-md border border-app bg-elev px-3 py-2 text-sm text-app',
      'placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 ring-accent ring-offset-2',
      'disabled:cursor-not-allowed disabled:opacity-50 transition-colors resize-none',
      className,
    )}
    {...props}
  />
));
Textarea.displayName = 'Textarea';
