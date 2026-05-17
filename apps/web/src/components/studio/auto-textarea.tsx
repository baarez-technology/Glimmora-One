'use client';

import { forwardRef, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  minRows?: number;
};

// Textarea that grows with its content. Avoids the boxed-in feeling on long
// descriptions while keeping the rest of the form layout stable.
export const AutoTextarea = forwardRef<HTMLTextAreaElement, Props>(
  ({ className, minRows = 3, value, onChange, style, ...rest }, _ref) => {
    const innerRef = useRef<HTMLTextAreaElement>(null);

    function resize() {
      const el = innerRef.current;
      if (!el) return;
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }

    useEffect(() => {
      resize();
    }, [value]);

    return (
      <textarea
        ref={innerRef}
        rows={minRows}
        value={value}
        onChange={(e) => {
          onChange?.(e);
          resize();
        }}
        style={{ overflow: 'hidden', ...style }}
        className={cn(
          'flex w-full rounded-md border border-app bg-elev px-3 py-2 text-sm text-app',
          'placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 ring-accent ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50 transition-colors resize-none',
          className,
        )}
        {...rest}
      />
    );
  },
);
AutoTextarea.displayName = 'AutoTextarea';
