import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { backendData } from '@/lib/backend';
import type { Circle, CirclePost } from '@/lib/types';
import { CirclePoster } from '@/components/circle-poster';
import { formatRelative } from '@/lib/utils';

export default async function CircleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [circles, posts] = await Promise.all([
    backendData<Circle[]>('/v1/community/circles'),
    backendData<CirclePost[]>(`/v1/community/circles/${slug}/posts`),
  ]);
  const circle = circles.find((c) => c.slug === slug);
  if (!circle) return null;

  return (
    <div className="px-4 lg:px-8 py-8 max-w-3xl">
      <Link href="/circles" className="inline-flex items-center text-sm text-muted hover:text-app">
        <ChevronLeft className="h-4 w-4" /> All circles
      </Link>
      <h1 className="font-serif text-3xl mt-3">{circle.name}</h1>
      <p className="text-muted mt-1">{circle.description}</p>

      <div className="mt-6">
        <CirclePoster slug={slug} />
      </div>

      <div className="mt-8 space-y-4">
        {posts.length === 0 && (
          <p className="text-sm text-muted">Quiet here. Someone has to be first — could be you.</p>
        )}
        {posts.map((p) => (
          <div key={p.id} className="rounded-lg border border-app bg-elev p-5">
            <div className="flex items-center justify-between text-xs text-muted">
              <span>{p.anonymousHandle}</span>
              <span>{formatRelative(p.createdAt)}</span>
            </div>
            <p className="mt-2 whitespace-pre-wrap leading-relaxed">{p.body}</p>
            <form action={`/api/proxy/v1/community/posts/${p.id}/report`} method="post" className="mt-3">
              <button type="submit" className="text-xs text-muted hover:text-app">
                Report
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
