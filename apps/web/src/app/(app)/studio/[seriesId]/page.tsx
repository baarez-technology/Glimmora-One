import { notFound } from 'next/navigation';
import { backendData, BackendError } from '@/lib/backend';
import type { StudioSeries } from '@/lib/types';
import { SeriesEditor } from './series-editor';

export default async function StudioSeriesPage({
  params,
}: {
  params: Promise<{ seriesId: string }>;
}) {
  const { seriesId } = await params;
  let series: StudioSeries;
  try {
    series = await backendData<StudioSeries>(`/v1/studio/series/${seriesId}`);
  } catch (e) {
    if (e instanceof BackendError && (e.status === 404 || e.status === 403)) {
      notFound();
    }
    throw e;
  }

  return <SeriesEditor initial={series} />;
}
