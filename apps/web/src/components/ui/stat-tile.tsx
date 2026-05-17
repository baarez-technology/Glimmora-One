'use client';

import { cn } from '@/lib/utils';

type Props = {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
  active?: boolean;
  onClick?: () => void;
  className?: string;
};

export function StatTile({ label, value, sub, accent, active, onClick, className }: Props) {
  const isButton = typeof onClick === 'function';
  const Comp = isButton ? 'button' : 'div';
  return (
    <Comp
      type={isButton ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'stat-tile text-left w-full',
        accent && 'accent',
        active && 'tile-active',
        isButton && 'cursor-pointer',
        className,
      )}
    >
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
      {sub && <p className="stat-sub">{sub}</p>}
    </Comp>
  );
}
