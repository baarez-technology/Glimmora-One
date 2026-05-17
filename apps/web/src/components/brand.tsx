import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Brand({ className, href = '/' }: { className?: string; href?: string }) {
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
        sizes="(min-width: 1024px) 200px, 160px"
        className="h-10 w-auto lg:h-12 select-none transition-transform duration-300 ease-soft group-hover:scale-[1.02] drop-shadow-[0_4px_18px_rgba(233,169,50,0.20)]"
      />
    </Link>
  );
}
