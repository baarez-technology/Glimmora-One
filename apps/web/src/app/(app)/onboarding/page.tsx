'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight, ChevronLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input, Textarea } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const FOCUS_AREAS: { key: string; label: string; line: string }[] = [
  { key: 'stillness', label: 'Stillness', line: 'a quieter mind' },
  { key: 'becoming', label: 'Becoming', line: 'growing without forcing it' },
  { key: 'emotion', label: 'Feeling', line: 'speaking inner weather' },
  { key: 'grief', label: 'Grief', line: 'sitting with loss' },
  { key: 'joy', label: 'Joy', line: 'returning to gladness' },
  { key: 'relationships', label: 'Relationships', line: 'being more present with others' },
  { key: 'work', label: 'Work', line: 'rest from striving' },
  { key: 'sleep', label: 'Sleep', line: 'softer nights' },
  { key: 'creativity', label: 'Creativity', line: 'making something true' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [reason, setReason] = useState('');
  const [intention, setIntention] = useState('');
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleArea(key: string) {
    setFocusAreas((curr) => {
      if (curr.includes(key)) return curr.filter((k) => k !== key);
      if (curr.length >= 4) return curr;
      return [...curr, key];
    });
  }

  async function submit(skipped: boolean) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/proxy/v1/users/onboard', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          skipped,
          fullName: name || null,
          reason: reason || null,
          intention: intention || null,
          focusAreas,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json?.error ?? 'Could not save');
      router.push('/dashboard');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="absolute inset-0 aurora pointer-events-none" />
      {/* Skip lives below the floating top-right utility cluster (bell / theme / sign-out).
          16 (cluster top offset) + ~36 (cluster height) + 12 breathing room = 64px ≈ pt-16. */}
      <header className="container pt-16 pb-4 flex items-center justify-end relative">
        <button
          onClick={() => submit(true)}
          disabled={submitting}
          className="text-sm text-muted hover:text-app underline-offset-4 hover:underline"
        >
          Skip for now →
        </button>
      </header>

      <main className="flex-1 grid place-items-center px-4 relative">
        <Card className="w-full max-w-xl">
          <CardContent className="pt-8 pb-8 space-y-6">
            <Steps current={step} />

            {step === 0 && (
              <div className="animate-fade-up space-y-4">
                <p className="text-sm uppercase tracking-[0.18em] text-glimmer-500">Welcome</p>
                <h1 className="font-serif text-3xl leading-tight">A calm room for your inner life.</h1>
                <p className="text-muted">
                  We'll take four small steps. You can skip any of them. Nothing here gets shared with
                  anyone else.
                </p>
                <div className="space-y-2">
                  <label className="text-sm text-muted">What should we call you?</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="First name (or anything you like)" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted">In a few words — what brought you here today?</label>
                  <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Tired. Curious. Restless. Just trying." />
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="animate-fade-up space-y-4">
                <p className="text-sm uppercase tracking-[0.18em] text-glimmer-500">Intention</p>
                <h2 className="font-serif text-2xl leading-tight">
                  In one sentence — what do you hope shifts, even a little?
                </h2>
                <p className="text-muted text-sm">
                  This isn't a goal. It's a direction. We'll come back to it gently.
                </p>
                <Textarea
                  rows={4}
                  value={intention}
                  onChange={(e) => setIntention(e.target.value)}
                  placeholder="e.g. I'd like to feel less rushed in the mornings."
                />
              </div>
            )}

            {step === 2 && (
              <div className="animate-fade-up space-y-4">
                <p className="text-sm uppercase tracking-[0.18em] text-glimmer-500">Focus</p>
                <h2 className="font-serif text-2xl leading-tight">Pick up to four areas that feel alive for you right now.</h2>
                <p className="text-muted text-sm">You can change these any time. {focusAreas.length}/4 chosen.</p>
                <div className="grid sm:grid-cols-2 gap-2">
                  {FOCUS_AREAS.map((a) => {
                    const active = focusAreas.includes(a.key);
                    const disabled = !active && focusAreas.length >= 4;
                    return (
                      <button
                        key={a.key}
                        onClick={() => toggleArea(a.key)}
                        disabled={disabled}
                        className={cn(
                          'rounded-lg border p-3 text-left transition-all',
                          active
                            ? 'border-glimmer-400 bg-glimmer-100/60 dark:bg-glimmer-900/30 shadow-glow'
                            : 'border-app hover:border-glimmer-300',
                          disabled && 'opacity-40 cursor-not-allowed',
                        )}
                      >
                        <p className="font-medium">{a.label}</p>
                        <p className="text-xs text-muted mt-0.5">{a.line}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="animate-fade-up space-y-4 text-center py-4">
                <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-glimmer-100 dark:bg-glimmer-900/40">
                  <Sparkles className="h-5 w-5 text-glimmer-500" />
                </div>
                <h2 className="font-serif text-2xl">Ready when you are.</h2>
                <p className="text-muted text-sm max-w-md mx-auto">
                  Your companion will say hello in a moment. From there: the dashboard will hold
                  three small steps each day. None of them are obligations.
                </p>
                {intention && (
                  <p className="font-serif text-lg italic text-glimmer-600 dark:text-glimmer-300">
                    “{intention}”
                  </p>
                )}
              </div>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="ghost"
                disabled={step === 0 || submitting}
                onClick={() => setStep((s) => Math.max(0, s - 1))}
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>

              {step < 3 ? (
                <Button onClick={() => setStep((s) => s + 1)} disabled={submitting}>
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={() => submit(false)} disabled={submitting}>
                  {submitting ? 'Beginning…' : 'Begin'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function Steps({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={cn(
            'h-1 flex-1 rounded-full transition-colors',
            i <= current ? 'bg-glimmer-400' : 'bg-ink-200 dark:bg-ink-800',
          )}
        />
      ))}
    </div>
  );
}
