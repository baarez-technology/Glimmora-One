import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Play } from 'lucide-react';
import { backendData } from '@/lib/backend';
import { BackendError } from '@/lib/backend';
import { Button } from '@/components/ui/button';
import { formatDuration } from '@/lib/utils';
import type { Series } from '@/lib/types';

export default async function SeriesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let series: Series;
  try {
    series = await backendData<Series>(`/v1/content/series/${slug}`);
  } catch (e) {
    if (e instanceof BackendError && e.status === 404) notFound();
    throw e;
  }

  return (
    <div>
      <section className="relative h-72 md:h-96 overflow-hidden">
        {series.heroUrl && (
          <Image src={series.heroUrl} alt={series.title} fill className="object-cover" priority />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-app via-app/60 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 container py-8">
          <p className="text-xs uppercase tracking-widest text-glimmer-500">{series.category}</p>
          <h1 className="font-serif text-4xl md:text-5xl mt-2">{series.title}</h1>
          <p className="text-muted mt-2 max-w-2xl">{series.tagline}</p>
          {series.episodes[0] && (
            <Button asChild className="mt-5">
              <Link href={`/watch/${series.slug}/${series.episodes[0].slug}`}>
                <Play className="h-4 w-4" /> Begin
              </Link>
            </Button>
          )}
        </div>
      </section>

      <section className="container py-10 grid lg:grid-cols-3 gap-10 max-w-6xl">
        <aside className="lg:col-span-1">
          <h2 className="font-serif text-xl">About this series</h2>
          <p className="text-muted mt-2 leading-relaxed">{series.description}</p>
          {series.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {series.tags.map((t) => (
                <span key={t} className="text-xs rounded-full border border-app px-3 py-1 text-muted">
                  {t}
                </span>
              ))}
            </div>
          )}
        </aside>

        <div className="lg:col-span-2 space-y-3">
          <h2 className="font-serif text-xl">Episodes</h2>
          <ol className="space-y-2">
            {series.episodes.map((ep, idx) => (
              <li key={ep.id}>
                <Link
                  href={`/watch/${series.slug}/${ep.slug}`}
                  className="flex items-center gap-4 rounded-lg border border-app bg-elev p-4 hover:shadow-glow transition"
                >
                  <span className="grid place-items-center h-9 w-9 rounded-full bg-glimmer-100 text-ink-700 dark:bg-glimmer-900/40 dark:text-glimmer-200 text-sm font-medium">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{ep.title}</p>
                    <p className="text-sm text-muted truncate">{ep.synopsis}</p>
                  </div>
                  <span className="text-xs text-muted">{formatDuration(ep.durationSeconds)}</span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}
