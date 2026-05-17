import { cn } from '@/lib/utils';

type Props = {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
  className?: string;
};

export function StatTile({ label, value, sub, accent, className }: Props) {
  return (
    <div className={cn('stat-tile', accent && 'accent', className)}>
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
      {sub && <p className="stat-sub">{sub}</p>}
    </div>
  );
}
