import Link from 'next/link';
import { Plus } from 'lucide-react';
import { backendData } from '@/lib/backend';
import type { DigitalTwinSnapshot, Reflection } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendChart } from '@/components/trend-chart';
import { ReflectionList } from '@/components/reflection-list';

const VALID_RANGES = new Set(['7', '30', '90', '365']);

export default async function ReflectPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; mood?: string; range?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const range = VALID_RANGES.has(sp.range ?? '') ? sp.range! : '30';
  const params = new URLSearchParams();
  if (sp.q) params.set('q', sp.q);
  if (sp.mood) params.set('mood', sp.mood);

  const [reflections, twin] = await Promise.all([
    backendData<Reflection[]>(`/v1/reflection${params.toString() ? `?${params.toString()}` : ''}`),
    backendData<DigitalTwinSnapshot>(`/v1/reflection/insights/twin?days=${range}`),
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
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle>
              {range === '7' && 'Last 7 days'}
              {range === '30' && 'Last 30 days'}
              {range === '90' && 'Last 90 days'}
              {range === '365' && 'Last year'}
            </CardTitle>
            <div className="flex gap-1 text-xs">
              {(['7', '30', '90', '365'] as const).map((r) => {
                const otherParams = new URLSearchParams(params);
                otherParams.set('range', r);
                return (
                  <Link
                    key={r}
                    href={`/reflect?${otherParams.toString()}`}
                    className={
                      'rounded-full px-3 py-1 border transition ' +
                      (range === r
                        ? 'border-glimmer-400 bg-glimmer-100/60 dark:bg-glimmer-900/30 text-glimmer-700 dark:text-glimmer-200'
                        : 'border-app text-muted hover:text-app')
                    }
                  >
                    {r === '365' ? '1y' : `${r}d`}
                  </Link>
                );
              })}
            </div>
          </div>
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
          <CardContent>
            <ReflectionList initial={reflections} q={sp.q ?? ''} mood={sp.mood ?? ''} />
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
