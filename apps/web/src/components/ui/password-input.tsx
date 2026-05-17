'use client';

import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export const PasswordInput = React.forwardRef<
  HTMLInputElement,
  Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>
>(({ className, ...props }, ref) => {
  const [shown, setShown] = React.useState(false);
  return (
    <div className="relative">
      <input
        ref={ref}
        type={shown ? 'text' : 'password'}
        className={cn(
          'flex h-10 w-full rounded-md border border-app bg-elev px-3 pr-10 py-2 text-sm text-app',
          'placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 ring-accent ring-offset-2 ring-offset-transparent',
          'disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
          className,
        )}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        aria-label={shown ? 'Hide password' : 'Show password'}
        aria-pressed={shown}
        tabIndex={-1}
        className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-md text-muted hover:text-app hover:bg-ink-100/60 dark:hover:bg-ink-800/40 transition-colors"
      >
        {shown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
});
PasswordInput.displayName = 'PasswordInput';
