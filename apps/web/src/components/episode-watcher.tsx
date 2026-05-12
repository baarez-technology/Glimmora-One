'use client';

import Link from 'next/link';
import { useState } from 'react';
import { VideoPlayer } from './video-player';
import { Button } from './ui/button';
import { Textarea } from './ui/input';
import { Sparkles } from 'lucide-react';
import type { Episode } from '@/lib/types';

type Props = {
  episode: Episode;
  startAt?: number;
};

export function EpisodeWatcher({ episode, startAt = 0 }: Props) {
  const [reflectionOpen, setReflectionOpen] = useState(false);
  const [reflection, setReflection] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reportProgress(positionSeconds: number, duration: number) {
    try {
      const completed = duration > 0 && positionSeconds / duration > 0.95;
      await fetch('/api/proxy/v1/content/progress', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          episodeId: episode.id,
          positionSeconds: Math.floor(positionSeconds),
          completed,
        }),
      });
    } catch {
      // best-effort
    }
  }

  async function submitReflection() {
    if (!reflection.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/proxy/v1/reflection', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          content: reflection,
          prompt: episode.reflectionPrompt,
          episodeId: episode.id,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json?.error ?? 'Could not save');
      setSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="aspect-video rounded-lg overflow-hidden shadow-soft">
        <VideoPlayer
          src={episode.videoUrl}
          poster={episode.posterUrl}
          startAt={startAt}
          onProgress={reportProgress}
          onEnded={() => setReflectionOpen(true)}
        />
      </div>

      {episode.reflectionPrompt && (
        <div className="rounded-lg border border-glimmer-300/60 bg-glimmer-50 dark:bg-glimmer-900/20 p-5">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-glimmer-500 mt-1" />
            <div className="flex-1">
              <p className="text-xs uppercase tracking-widest text-glimmer-700 dark:text-glimmer-300">
                A question for after
              </p>
              <p className="mt-1 font-serif text-xl">{episode.reflectionPrompt}</p>

              {!reflectionOpen && !submitted && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3"
                  onClick={() => setReflectionOpen(true)}
                >
                  Write a reflection
                </Button>
              )}

              {reflectionOpen && !submitted && (
                <div className="mt-4 space-y-2">
                  <Textarea
                    rows={4}
                    placeholder="A sentence or two is enough…"
                    value={reflection}
                    onChange={(e) => setReflection(e.target.value)}
                  />
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <div className="flex gap-2">
                    <Button onClick={submitReflection} disabled={saving || !reflection.trim()}>
                      {saving ? 'Saving…' : 'Save reflection'}
                    </Button>
                    <Button variant="ghost" onClick={() => setReflectionOpen(false)}>
                      Not now
                    </Button>
                  </div>
                </div>
              )}

              {submitted && (
                <p className="mt-3 text-sm text-muted">
                  Saved. <Link className="text-glimmer-500 hover:underline" href="/reflect">See your journal →</Link>
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
