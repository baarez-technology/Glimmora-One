import { notFound } from 'next/navigation';
import { backendData, BackendError } from '@/lib/backend';
import type { StudioSeries } from '@/lib/types';
import { EpisodeEditor } from './episode-editor';

export default async function StudioEpisodePage({
  params,
}: {
  params: Promise<{ seriesId: string; episodeId: string }>;
}) {
  const { seriesId, episodeId } = await params;
  let series: StudioSeries;
  try {
    series = await backendData<StudioSeries>(`/v1/studio/series/${seriesId}`);
  } catch (e) {
    if (e instanceof BackendError && (e.status === 404 || e.status === 403)) notFound();
    throw e;
  }
  const ep = series.episodes.find((e) => e.id === episodeId);
  if (!ep) notFound();
  return <EpisodeEditor seriesId={seriesId} initial={ep} />;
}
