import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { backendData, BackendError } from '@/lib/backend';
import { EpisodeWatcher } from '@/components/episode-watcher';
import type { Series, WatchProgress } from '@/lib/types';

export default async function EpisodePage({
  params,
}: {
  params: Promise<{ slug: string; episode: string }>;
}) {
  const { slug, episode: epSlug } = await params;

  let series: Series;
  try {
    series = await backendData<Series>(`/v1/content/series/${slug}`);
  } catch (e) {
    if (e instanceof BackendError && e.status === 404) notFound();
    throw e;
  }
  const episode = series.episodes.find((e) => e.slug === epSlug);
  if (!episode) notFound();

  const progress = await backendData<WatchProgress | null>(
    `/v1/content/progress/${episode.id}`,
  ).catch(() => null);
  const startAt =
    progress && !progress.completed && progress.positionSeconds > 5
      ? progress.positionSeconds
      : 0;

  const next = series.episodes[episode.orderIndex + 1];

  return (
    <div className="px-4 lg:px-8 py-6 max-w-5xl">
      <Link href={`/watch/${series.slug}`} className="inline-flex items-center text-sm text-muted hover:text-app">
        <ChevronLeft className="h-4 w-4" /> Back to {series.title}
      </Link>
      <h1 className="font-serif text-3xl mt-3">{episode.title}</h1>
      <p className="text-muted text-sm mt-1">{series.title} · Episode {episode.orderIndex + 1}</p>

      <div className="mt-6">
        <EpisodeWatcher episode={episode} startAt={startAt} />
      </div>

      <p className="mt-6 text-muted leading-relaxed max-w-prose">{episode.synopsis}</p>

      {next && (
        <Link
          href={`/watch/${series.slug}/${next.slug}`}
          className="mt-10 flex items-center justify-between rounded-lg border border-app bg-elev p-5 hover:shadow-glow transition"
        >
          <div>
            <p className="text-xs uppercase tracking-widest text-glimmer-500">Next</p>
            <p className="font-serif text-lg mt-1">{next.title}</p>
          </div>
          <span className="text-muted">→</span>
        </Link>
      )}
    </div>
  );
}
