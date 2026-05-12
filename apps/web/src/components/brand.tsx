import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Brand({ className, href = '/' }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn('inline-flex items-center gap-2 group', className)}>
      <span className="relative inline-flex h-7 w-7 items-center justify-center">
        <span className="absolute inset-0 rounded-full bg-glimmer-300/40 blur-md group-hover:bg-glimmer-300/60 transition" />
        <span className="relative inline-flex h-4 w-4 rounded-full bg-glimmer-400 animate-breathe shadow-glow" />
      </span>
      <span className="font-serif text-lg tracking-tight">
        Glimmora <span className="text-glimmer-500">ONE</span>
      </span>
    </Link>
  );
}
