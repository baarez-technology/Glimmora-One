import Link from 'next/link';
import { Plus } from 'lucide-react';
import { backendData } from '@/lib/backend';
import type { DigitalTwinSnapshot, Reflection } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatRelative } from '@/lib/utils';
import { TrendChart } from '@/components/trend-chart';

export default async function ReflectPage() {
  const [reflections, twin] = await Promise.all([
    backendData<Reflection[]>('/v1/reflection'),
    backendData<DigitalTwinSnapshot>('/v1/reflection/insights/twin'),
  ]);

  return (
    <div className="px-4 lg:px-8 py-8 space-y-10 max-w-6xl">
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-glimmer-500">Reflect</p>
          <h1 className="font-serif text-3xl md:text-4xl mt-1">Your inner weather.</h1>
          <p className="text-muted mt-1">
            What you write here belongs to you. We just hold the patterns gently.
          </p>
        </div>
        <Button asChild>
          <Link href="/reflect/new">
            <Plus className="h-4 w-4" /> New reflection
          </Link>
        </Button>
      </header>

      <section className="grid lg:grid-cols-4 gap-4">
        {[
          { label: 'Reflections', value: twin.totalReflections.toString() },
          { label: 'Day streak', value: `${twin.streakDays}` },
          { label: 'Most-present', value: twin.dominantMood ?? '—' },
          { label: 'Avg. intensity', value: twin.averageIntensity.toFixed(1) },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <p className="text-xs uppercase tracking-widest text-muted">{s.label}</p>
              <p className="font-serif text-3xl mt-1">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Last 30 days</CardTitle>
        </CardHeader>
        <CardContent>
          <TrendChart points={twin.last30Days} />
        </CardContent>
      </Card>

      <section className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Journal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {reflections.length === 0 && (
              <p className="text-muted text-sm">Nothing yet. The first sentence is the hardest.</p>
            )}
            {reflections.map((r) => (
              <div key={r.id} className="border-b border-app/60 last:border-0 pb-4 last:pb-0">
                <div className="flex items-center justify-between text-xs text-muted">
                  <span>{formatRelative(r.createdAt)}</span>
                  <span className="flex items-center gap-2">
                    {r.mood && <span className="rounded-full bg-glimmer-100 dark:bg-glimmer-900/40 text-glimmer-700 dark:text-glimmer-200 px-2 py-0.5">{r.mood}</span>}
                    <span>intensity {r.intensity}</span>
                  </span>
                </div>
                {r.prompt && (
                  <p className="mt-2 text-sm italic text-muted">“{r.prompt}”</p>
                )}
                <p className="mt-1 leading-relaxed whitespace-pre-wrap">{r.content}</p>
                {r.insights && (
                  <p className="mt-3 text-sm text-glimmer-600 dark:text-glimmer-300">
                    ✦ {r.insights}
                  </p>
                )}
                {r.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {r.tags.map((t) => (
                      <span key={t} className="text-[10px] uppercase tracking-widest rounded-full border border-app px-2 py-0.5 text-muted">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Milestones</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {twin.growthMilestones.length === 0 && (
                <li className="text-muted">Your first reflection unlocks the first milestone.</li>
              )}
              {twin.growthMilestones.map((m) => (
                <li key={m} className="flex gap-2">
                  <span className="text-glimmer-500">✦</span> {m}
                </li>
              ))}
            </ul>
            {twin.tagCloud.length > 0 && (
              <div className="mt-6">
                <p className="text-xs uppercase tracking-widest text-muted mb-2">Threads</p>
                <div className="flex flex-wrap gap-2">
                  {twin.tagCloud.map((t) => (
                    <span
                      key={t.tag}
                      className="rounded-full border border-app px-3 py-1 text-sm"
                      style={{ fontSize: `${Math.min(1.05, 0.75 + t.count * 0.05)}rem` }}
                    >
                      {t.tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
