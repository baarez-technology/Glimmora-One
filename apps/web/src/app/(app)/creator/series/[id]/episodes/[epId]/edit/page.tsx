import { notFound } from 'next/navigation';
import { backendData, BackendError } from '@/lib/backend';
import type { Series } from '@/lib/types';
import { EpisodeEditor } from '@/components/episode-editor';

export default async function EditEpisodePage({
  params,
}: {
  params: Promise<{ id: string; epId: string }>;
}) {
  const { id, epId } = await params;
  let series: Series;
  try {
    series = await backendData<Series>(`/v1/creator/series/${id}`);
  } catch (e) {
    if (e instanceof BackendError && (e.status === 404 || e.status === 403)) notFound();
    throw e;
  }
  const ep = series.episodes.find((e) => e.id === epId);
  if (!ep) notFound();
  return (
    <div className="px-4 lg:px-8 py-8 max-w-2xl">
      <EpisodeEditor episode={ep} seriesId={id} />
    </div>
  );
}
