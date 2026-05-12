import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Check, Sparkles } from 'lucide-react';
import { backendData } from '@/lib/backend';
import type {
  ContinueWatchingItem,
  DailyPlan,
  DigitalTwinSnapshot,
  Episode,
  Series,
  User,
} from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn, formatDuration, formatRelative } from '@/lib/utils';

function timeOfDayGreeting(name: string) {
  const h = new Date().getHours();
  if (h < 5) return `Still up, ${name}?`;
  if (h < 12) return `Good morning, ${name}.`;
  if (h < 18) return `Good afternoon, ${name}.`;
  return `Good evening, ${name}.`;
}

// Map focus areas (from onboarding) to categories in the catalog, for recommending paths.
const FOCUS_TO_CATEGORY: Record<string, string[]> = {
  stillness: ['meditation'],
  becoming: ['growth'],
  emotion: ['emotional-intelligence'],
  grief: ['emotional-intelligence'],
  joy: ['emotional-intelligence', 'growth'],
  relationships: ['growth', 'emotional-intelligence'],
  work: ['growth', 'meditation'],
  sleep: ['meditation'],
  creativity: ['growth'],
};

export default async function DashboardPage() {
  const [user, series, twin, cont, recs, plan] = await Promise.all([
    backendData<User>('/v1/auth/me'),
    backendData<Series[]>('/v1/content/series'),
    backendData<DigitalTwinSnapshot>('/v1/reflection/insights/twin').catch(() => null),
    backendData<ContinueWatchingItem[]>('/v1/content/continue-watching').catch(() => []),
    backendData<Episode[]>('/v1/content/recommendations').catch(() => []),
    backendData<DailyPlan>('/v1/dashboard/today').catch(() => null),
  ]);

  const firstName = user.fullName?.split(' ')[0] || user.username;
  const featured = series[0];

  // "Paths for you" = series whose category aligns with any of the user's focus areas.
  const focusAreas = (plan?.focusAreas ?? []) as string[];
  const wantedCategories = new Set(focusAreas.flatMap((f) => FOCUS_TO_CATEGORY[f] ?? []));
  const paths = wantedCategories.size
    ? series.filter((s) => wantedCategories.has(s.category)).slice(0, 4)
    : series.slice(0, 4);

  return (
    <div className="px-4 lg:px-8 py-8 space-y-10 max-w-6xl">
      <header className="space-y-1">
        <p className="text-sm uppercase tracking-[0.18em] text-glimmer-500">
          Today · {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
        </p>
        <h1 className="font-serif text-3xl md:text-4xl">{timeOfDayGreeting(firstName)}</h1>
        {plan?.intention && (
          <p className="font-serif italic text-muted text-lg max-w-2xl">“{plan.intention}”</p>
        )}
      </header>

      {plan && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl">Three small steps</h2>
            <p className="text-sm text-muted">
              {plan.allDone ? 'All three today. Thank you for showing up.' : `${plan.steps.filter((s) => s.done).length} of 3 · streak ${plan.streak}`}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {plan.steps.map((step, i) => (
              <Link
                key={step.key}
                href={step.href}
                className={cn(
                  'group rounded-lg border p-5 transition-all',
                  step.done
                    ? 'border-glimmer-300/60 bg-glimmer-50 dark:bg-glimmer-900/20'
                    : 'border-app bg-elev hover:shadow-glow',
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-widest text-glimmer-500">
                    Step {i + 1}
                  </span>
                  {step.done ? (
                    <Check className="h-4 w-4 text-glimmer-500" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-glimmer-300 animate-breathe" />
                  )}
                </div>
                <h3 className="font-serif text-xl mt-3">{step.title}</h3>
                <p className="text-sm text-muted mt-1">{step.description}</p>
                <p className="text-sm text-glimmer-600 dark:text-glimmer-300 mt-4 inline-flex items-center gap-1">
                  {step.done ? 'Done — open again' : step.cta} <ArrowRight className="h-3.5 w-3.5" />
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="grid lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 overflow-hidden">
          {featured?.heroUrl && (
            <div className="relative h-44">
              <Image
                src={featured.heroUrl}
                alt={featured.title}
                fill
                className="object-cover opacity-90"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950/70 to-transparent" />
              <div className="absolute bottom-0 p-5 text-white">
                <p className="text-xs uppercase tracking-widest text-glimmer-300">Featured journey</p>
                <h2 className="font-serif text-2xl">{featured.title}</h2>
                <p className="text-sm opacity-90 max-w-prose">{featured.tagline}</p>
              </div>
            </div>
          )}
          <CardContent className="pt-5 flex items-center justify-between">
            <p className="text-sm text-muted max-w-md">{featured?.description?.slice(0, 140)}…</p>
            <Button asChild>
              <Link href={`/watch/${featured?.slug}`}>
                Open <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your inner weather</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Reflections" value={`${twin?.totalReflections ?? 0}`} />
            <Row label="Current streak" value={`${twin?.streakDays ?? 0} days`} />
            <Row label="Most-present" value={twin?.dominantMood ?? '—'} />
            <Row label="Avg. intensity" value={twin?.averageIntensity?.toFixed(1) ?? '0.0'} />
            <Button asChild variant="ghost" size="sm" className="w-full mt-2">
              <Link href="/reflect">
                Open journal <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {focusAreas.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl">Paths for you</h2>
            <p className="text-xs text-muted">tuned to {focusAreas.join(', ')}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {paths.map((s) => (
              <Link
                key={s.id}
                href={`/watch/${s.slug}`}
                className="rounded-lg overflow-hidden border border-app bg-elev hover:shadow-glow transition group"
              >
                <div className="relative h-28">
                  {s.coverUrl && (
                    <Image src={s.coverUrl} alt={s.title} fill className="object-cover opacity-90 group-hover:opacity-100" />
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium leading-snug">{s.title}</p>
                  <p className="text-xs text-muted mt-1">{s.episodes.length} episodes</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {cont.length > 0 && (
        <section>
          <h2 className="font-serif text-xl mb-4">Continue watching</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cont.map((c) => {
              const pct = c.episode.durationSeconds
                ? Math.min(100, Math.round((c.progress.positionSeconds / c.episode.durationSeconds) * 100))
                : 0;
              return (
                <Link
                  key={c.episode.id}
                  href={`/watch/${c.seriesSlug}/${c.episode.slug}`}
                  className="rounded-lg overflow-hidden border border-app bg-elev hover:shadow-glow transition group"
                >
                  <div className="relative h-32">
                    {c.seriesCoverUrl && (
                      <Image src={c.seriesCoverUrl} alt={c.seriesTitle} fill className="object-cover opacity-90 group-hover:opacity-100" />
                    )}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                      <div className="h-full bg-glimmer-400" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-muted">{c.seriesTitle}</p>
                    <p className="text-sm font-medium leading-snug">{c.episode.title}</p>
                    <p className="text-xs text-muted mt-1">
                      {formatDuration(c.episode.durationSeconds - c.progress.positionSeconds)} left · {formatRelative(c.progress.updatedAt)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section className="rounded-lg border border-app bg-elev p-6 flex items-center justify-between gap-6 flex-wrap">
        <div className="flex items-start gap-3 max-w-xl">
          <Sparkles className="h-5 w-5 text-glimmer-500 mt-1" />
          <div>
            <h3 className="font-serif text-xl">A small invitation</h3>
            <p className="text-sm text-muted">
              When you're ready, the companion is here. No agenda — just one sentence about how
              you're landing in today.
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href="/companion">Open companion</Link>
        </Button>
      </section>

      {user.role === 'member' && (
        <section className="rounded-lg border border-dashed border-app p-6">
          <p className="text-xs uppercase tracking-widest text-glimmer-500">For creators</p>
          <h3 className="font-serif text-xl mt-1">Do you have something quiet to share?</h3>
          <p className="text-sm text-muted mt-1 max-w-xl">
            Glimmora is built by listeners. If you teach, write, or make work that helps people
            come home to themselves, we'd love to know.
          </p>
          <Button asChild variant="ghost" size="sm" className="mt-3">
            <Link href="/creator/apply">Apply to become a creator →</Link>
          </Button>
        </section>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted">{label}</span>
      <span>{value}</span>
    </div>
  );
}
