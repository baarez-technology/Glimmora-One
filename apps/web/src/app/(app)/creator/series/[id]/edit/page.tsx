import { notFound } from 'next/navigation';
import { backendData, BackendError } from '@/lib/backend';
import type { Series } from '@/lib/types';
import { SeriesEditor } from '@/components/series-editor';

export default async function EditSeriesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let series: Series;
  try {
    series = await backendData<Series>(`/v1/creator/series/${id}`);
  } catch (e) {
    if (e instanceof BackendError && (e.status === 404 || e.status === 403)) notFound();
    throw e;
  }
  return (
    <div className="px-4 lg:px-8 py-8 max-w-3xl">
      <SeriesEditor series={series} />
    </div>
  );
}
