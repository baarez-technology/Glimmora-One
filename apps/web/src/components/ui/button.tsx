import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'group relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[transform,background-color,box-shadow,color] duration-200 ease-soft active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 ring-accent ring-offset-2 ring-offset-transparent disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none motion-reduce:active:scale-100',
  {
    variants: {
      variant: {
        primary:
          'bg-glimmer-400 text-ink-950 hover:bg-glimmer-300 shadow-soft hover:shadow-glow hover:-translate-y-px',
        secondary:
          'bg-elev text-app border border-app hover:bg-ink-100 dark:hover:bg-ink-800 hover:-translate-y-px',
        ghost: 'hover:bg-ink-100 dark:hover:bg-ink-800 text-app',
        outline:
          'border border-app text-app bg-transparent hover:bg-ink-100 dark:hover:bg-ink-800 hover:-translate-y-px',
        link: 'text-glimmer-500 hover:underline underline-offset-4',
        destructive:
          'bg-red-600 text-white hover:bg-red-700 hover:-translate-y-px',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4',
        lg: 'h-12 px-6 text-base',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { buttonVariants };
