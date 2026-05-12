import Image from 'next/image';
import Link from 'next/link';
import { backendData } from '@/lib/backend';
import type { Series } from '@/lib/types';

export default async function WatchPage() {
  const series = await backendData<Series[]>('/v1/content/series');

  // Group by category for a calm browse layout.
  const groups = new Map<string, Series[]>();
  for (const s of series) {
    const key = s.category;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(s);
  }

  return (
    <div className="px-4 lg:px-8 py-8 space-y-12 max-w-6xl">
      <header>
        <p className="text-sm uppercase tracking-[0.18em] text-glimmer-500">Stories</p>
        <h1 className="font-serif text-3xl md:text-4xl mt-1">The library.</h1>
        <p className="text-muted mt-2 max-w-xl">
          Quiet, well-made episodes. Each ends with a single question — gentle, never pushy.
        </p>
      </header>

      {[...groups.entries()].map(([category, list]) => (
        <section key={category}>
          <h2 className="font-serif text-xl mb-4 capitalize">{category.replace('-', ' ')}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {list.map((s) => (
              <Link
                key={s.id}
                href={`/watch/${s.slug}`}
                className="group rounded-lg overflow-hidden border border-app bg-elev hover:shadow-glow transition"
              >
                <div className="relative h-40">
                  {s.coverUrl && (
                    <Image
                      src={s.coverUrl}
                      alt={s.title}
                      fill
                      className="object-cover opacity-90 group-hover:opacity-100 transition"
                    />
                  )}
                  {s.tier === 'premium' && (
                    <span className="absolute top-3 right-3 text-[10px] uppercase tracking-widest bg-glimmer-400 text-ink-950 rounded-full px-2 py-0.5">
                      premium
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-serif text-lg">{s.title}</h3>
                  <p className="text-sm text-muted mt-1">{s.tagline}</p>
                  <p className="text-xs text-muted mt-3">{s.episodes.length} episodes</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
