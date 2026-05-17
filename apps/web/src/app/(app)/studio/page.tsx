import Link from 'next/link';
import { Film, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { backendData } from '@/lib/backend';
import type { StudioSeriesRow, User } from '@/lib/types';

export default async function StudioPage() {
  const [user, series] = await Promise.all([
    backendData<User>('/v1/auth/me'),
    backendData<StudioSeriesRow[]>('/v1/studio/series').catch(() => [] as StudioSeriesRow[]),
  ]);
  const firstName = user.fullName?.split(' ')[0] || user.username;

  return (
    <div className="relative px-4 lg:px-8 py-8 max-w-5xl space-y-8">
      <div className="glow-orb lg" style={{ top: '-180px', right: '-160px' }} />

      <header className="relative flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-glimmer-500">Creator studio</p>
          <h1 className="font-serif text-4xl md:text-5xl mt-1">
            {series.length === 0 ? `Welcome, ${firstName}.` : `Your work, ${firstName}.`}
          </h1>
          <p className="text-muted mt-3 max-w-2xl leading-relaxed">
            {series.length === 0
              ? "Begin a series when you're ready. There's no rush. AI can help you draft the shape — you keep every word."
              : 'Drafts and published series live here. Tap one to edit, add episodes, or publish.'}
          </p>
        </div>
        <Button asChild>
          <Link href="/studio/new">
            <Plus className="h-4 w-4" /> New series
          </Link>
        </Button>
      </header>

      {series.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-glimmer-100 dark:bg-glimmer-900/40">
              <Sparkles className="h-5 w-5 text-glimmer-500" />
            </div>
            <p className="text-muted max-w-md mx-auto leading-relaxed">
              You don't have a series yet. Start with a title — give it a name, let the AI sketch a
              tagline and outline, then write the rest.
            </p>
            <Button asChild>
              <Link href="/studio/new">
                <Plus className="h-4 w-4" /> Create your first series
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {series.map((s) => (
            <Link
              key={s.id}
              href={`/studio/${s.id}`}
              className="group panel overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glow"
            >
              <div
                className="aspect-[16/9] w-full bg-elev relative"
                style={s.coverUrl ? { backgroundImage: `url(${s.coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
              >
                {!s.coverUrl && (
                  <div className="absolute inset-0 grid place-items-center text-muted">
                    <Film className="h-10 w-10" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  {s.tier === 'premium' && (
                    <span className="text-[10px] uppercase tracking-widest rounded-full px-2 py-0.5 bg-glimmer-400 text-ink-950 font-medium">
                      Premium
                    </span>
                  )}
                  <span
                    className={`text-[10px] uppercase tracking-widest rounded-full px-2 py-0.5 font-medium ${
                      s.published
                        ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30'
                        : 'bg-ink-200/40 text-muted ring-1 ring-app/40'
                    }`}
                  >
                    {s.published ? 'Published' : 'Draft'}
                  </span>
                </div>
              </div>
              <div className="p-4 space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-glimmer-500">{s.category}</p>
                <h3 className="font-serif text-lg leading-tight group-hover:text-glimmer-400 transition-colors">
                  {s.title}
                </h3>
                {s.tagline && <p className="text-xs text-muted line-clamp-2">{s.tagline}</p>}
                <p className="text-xs text-muted pt-1">
                  {s.episodeCount} {s.episodeCount === 1 ? 'episode' : 'episodes'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
