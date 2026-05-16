import Image from 'next/image';
import Link from 'next/link';
import { backendData } from '@/lib/backend';
import type { ContinueWatchingItem, Series } from '@/lib/types';

export default async function WatchPage() {
  const [series, continueItems] = await Promise.all([
    backendData<Series[]>('/v1/content/series'),
    backendData<ContinueWatchingItem[]>('/v1/content/continue-watching').catch(
      () => [] as ContinueWatchingItem[],
    ),
  ]);

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

      {continueItems.length > 0 && (
        <section>
          <h2 className="font-serif text-xl mb-4">Continue watching</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {continueItems.map((c) => {
              const dur = c.episode.durationSeconds || 1;
              const pct = Math.min(100, Math.round((c.progress.positionSeconds / dur) * 100));
              return (
                <Link
                  key={c.episode.id}
                  href={`/watch/${c.seriesSlug}/${c.episode.slug}`}
                  className="group rounded-lg overflow-hidden border border-app bg-elev hover:shadow-glow transition"
                >
                  <div className="relative h-32">
                    {c.seriesCoverUrl && (
                      <Image src={c.seriesCoverUrl} alt={c.seriesTitle} fill className="object-cover opacity-90" />
                    )}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-ink-900/30">
                      <div className="h-full bg-glimmer-400" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-xs uppercase tracking-widest text-glimmer-500">{c.seriesTitle}</p>
                    <p className="font-serif text-lg mt-1">{c.episode.title}</p>
                    <p className="text-xs text-muted mt-2">{pct}% watched · resume</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

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
