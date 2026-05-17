import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type Size = 'sm' | 'md' | 'lg';

// Visual sizes — the PNG is ~1.79:1, so width is auto from height.
const SIZE_CLASSES: Record<Size, string> = {
  sm: 'h-12',           // 48px — compact (mobile bar)
  md: 'h-14 lg:h-16',   // 56 → 64px — default (sidebar rail, marketing nav)
  lg: 'h-20 lg:h-24',   // 80 → 96px — hero / auth pages
};

export function Brand({
  className,
  href = '/',
  size = 'md',
}: {
  className?: string;
  href?: string;
  size?: Size;
}) {
  return (
    <Link
      href={href}
      aria-label="Glimmora ONE"
      className={cn('inline-flex items-center group', className)}
    >
      <Image
        src="/logo.png"
        alt="Glimmora ONE"
        width={520}
        height={290}
        priority
        sizes="(min-width: 1024px) 240px, 200px"
        className={cn(
          SIZE_CLASSES[size],
          'w-auto select-none transition-transform duration-300 ease-soft',
          'group-hover:scale-[1.02] drop-shadow-[0_4px_18px_rgba(233,169,50,0.20)]',
        )}
      />
    </Link>
  );
}
