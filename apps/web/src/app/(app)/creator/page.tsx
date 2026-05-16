import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus } from 'lucide-react';
import { backendData } from '@/lib/backend';
import type { Series, User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Analytics = {
  seriesCount: number;
  episodeCount: number;
  totalWatchers: number;
  completions: number;
};

export default async function CreatorStudioPage() {
  const me = await backendData<User>('/v1/auth/me');
  if (!['creator', 'admin', 'superadmin'].includes(me.role)) redirect('/creator/apply');

  const [mine, analytics] = await Promise.all([
    backendData<Series[]>('/v1/creator/mine').catch(() => [] as Series[]),
    backendData<Analytics>('/v1/creator/analytics').catch(() => ({
      seriesCount: 0,
      episodeCount: 0,
      totalWatchers: 0,
      completions: 0,
    })),
  ]);

  return (
    <div className="px-4 lg:px-8 py-8 space-y-10 max-w-6xl">
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-glimmer-500">Creator studio</p>
          <h1 className="font-serif text-3xl md:text-4xl mt-1">Your work, your audience.</h1>
          <p className="text-muted mt-1">
            What gets shared here is held with care. We design for depth, not for virality.
          </p>
        </div>
        <Button asChild>
          <Link href="/creator/series/new">
            <Plus className="h-4 w-4" /> New series
          </Link>
        </Button>
      </header>

      <section className="grid sm:grid-cols-4 gap-3">
        {[
          { k: 'Series', v: analytics.seriesCount },
          { k: 'Episodes', v: analytics.episodeCount },
          { k: 'Started watching', v: analytics.totalWatchers },
          { k: 'Finished', v: analytics.completions },
        ].map(({ k, v }) => (
          <Card key={k}>
            <CardContent className="pt-5">
              <p className="text-xs uppercase tracking-widest text-muted">{k}</p>
              <p className="font-serif text-2xl mt-1">{v}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section>
        <h2 className="font-serif text-xl mb-4">Your series</h2>
        {mine.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-muted text-sm">
              Nothing yet. <Link href="/creator/series/new" className="text-glimmer-500 hover:underline">Start a series</Link> when you're ready.
            </CardContent>
          </Card>
        )}
        <div className="space-y-3">
          {mine.map((s) => (
            <Card key={s.id}>
              <CardHeader>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <CardTitle>{s.title}</CardTitle>
                    <p className="text-muted text-sm mt-1">{s.tagline}</p>
                  </div>
                  <div className="text-sm text-muted">
                    {s.episodes.length} {s.episodes.length === 1 ? 'episode' : 'episodes'} ·{' '}
                    <span className="capitalize">{s.tier}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 flex items-center gap-3 flex-wrap">
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/watch/${s.slug}`}>Preview →</Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/creator/series/${s.id}/edit`}>Edit</Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/creator/series/${s.id}/episodes/new`}>+ Add episode</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
