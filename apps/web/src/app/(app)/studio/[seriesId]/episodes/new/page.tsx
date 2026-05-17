'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Plus, Sparkles, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, Textarea } from '@/components/ui/input';
import type { AIEpisodeFromTitle, StudioEpisode } from '@/lib/types';

type Envelope<T> = { success: boolean; data: T; error?: string };

export default function NewEpisodePage({
  params,
}: {
  params: Promise<{ seriesId: string }>;
}) {
  const { seriesId } = use(params);
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [reflectionPrompt, setReflectionPrompt] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [tier, setTier] = useState<'free' | 'premium'>('free');
  const [aiUsed, setAiUsed] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    if (!title.trim()) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/proxy/v1/studio/ai/episode-from-title', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          seriesId,
          durationSeconds: durationSeconds || undefined,
        }),
      });
      const env = (await res.json()) as Envelope<AIEpisodeFromTitle>;
      if (env.success && env.data) {
        setSynopsis(env.data.synopsis);
        setReflectionPrompt(env.data.reflectionPrompt);
        setTier(env.data.tier);
        setAiUsed(true);
      } else {
        setError("Couldn't generate. Write your own and save.");
      }
    } catch {
      setError("Couldn't reach the AI. Write your own and save.");
    } finally {
      setGenerating(false);
    }
  }

  async function generatePromptOnly() {
    if (!title.trim() && !synopsis.trim()) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/proxy/v1/studio/ai/episode-from-title', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: title.trim() || 'episode',
          seriesId,
        }),
      });
      const env = (await res.json()) as Envelope<AIEpisodeFromTitle>;
      if (env.success && env.data) {
        setReflectionPrompt(env.data.reflectionPrompt);
        setAiUsed(true);
      }
    } finally {
      setGenerating(false);
    }
  }

  async function save() {
    if (!title.trim() || !videoUrl.trim()) {
      setError('Title and video URL are required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/proxy/v1/studio/series/${seriesId}/episodes`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          synopsis: synopsis.trim() || null,
          reflectionPrompt: reflectionPrompt.trim() || null,
          videoUrl: videoUrl.trim(),
          posterUrl: posterUrl.trim() || null,
          durationSeconds,
          tier,
        }),
      });
      const env = (await res.json()) as Envelope<StudioEpisode>;
      if (!env.success) {
        setError(env.error || 'Could not save.');
        setSaving(false);
        return;
      }
      router.push(`/studio/${seriesId}`);
      router.refresh();
    } catch {
      setError('Network error while saving.');
      setSaving(false);
    }
  }

  return (
    <div className="relative px-4 lg:px-8 py-8 max-w-3xl space-y-6">
      <div className="glow-orb lg" style={{ top: '-180px', right: '-160px' }} />

      <Link
        href={`/studio/${seriesId}`}
        className="text-sm text-muted hover:text-app inline-flex items-center gap-1"
      >
        <ArrowLeft className="h-3 w-3" /> Back to series
      </Link>

      <header>
        <p className="text-sm uppercase tracking-[0.18em] text-glimmer-500">New episode</p>
        <h1 className="font-serif text-3xl md:text-4xl mt-1">Add an episode.</h1>
        <p className="text-muted mt-3 leading-relaxed">
          Start with the title. The AI can sketch a synopsis and a quiet closing question. You
          rewrite anything that doesn't sound like you.
        </p>
      </header>

      <Card>
        <CardContent className="space-y-5 pt-6">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-muted">Episode title</label>
            <div className="flex gap-2">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder='e.g. "Breath as a doorway"'
                autoFocus
              />
              <Button
                variant="outline"
                onClick={generate}
                disabled={!title.trim() || generating}
                size="sm"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Drafting
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" /> AI draft
                  </>
                )}
              </Button>
            </div>
          </div>

          {aiUsed && (
            <div className="rounded-md border border-glimmer-400/30 bg-glimmer-400/5 px-3 py-2">
              <p className="text-[11px] uppercase tracking-widest text-glimmer-500">
                <Sparkles className="inline h-3 w-3 mr-1" /> AI draft — review before publishing
              </p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-muted">Synopsis</label>
            <Textarea
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              placeholder="One or two short sentences about what's inside."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs uppercase tracking-widest text-muted">
                Closing reflection prompt
              </label>
              <button
                type="button"
                onClick={generatePromptOnly}
                disabled={generating || (!title.trim() && !synopsis.trim())}
                className="text-[11px] text-glimmer-500 hover:underline disabled:opacity-40 inline-flex items-center gap-1"
              >
                <Wand2 className="h-3 w-3" /> Suggest a question
              </button>
            </div>
            <Textarea
              value={reflectionPrompt}
              onChange={(e) => setReflectionPrompt(e.target.value)}
              placeholder="One open question the viewer sits with after watching."
              rows={2}
            />
            <p className="text-[11px] text-muted">
              Shown to the viewer after the episode ends. Keep it open and short — no advice.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-muted">
              Video URL <span className="text-red-400">*</span>
            </label>
            <Input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://… (HLS .m3u8, MP4, or any direct video URL)"
            />
            <p className="text-[11px] text-muted">
              Paste a hosted video URL (Cloudflare Stream, Mux, S3, etc). Upload-to-Glimmora is
              coming later.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-muted">
                Duration <span className="text-muted/60">(seconds)</span>
              </label>
              <Input
                type="number"
                min={0}
                value={durationSeconds || ''}
                onChange={(e) => setDurationSeconds(Math.max(0, Number(e.target.value) || 0))}
                placeholder="e.g. 540"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-muted">Tier</label>
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value as 'free' | 'premium')}
                className="flex h-10 w-full rounded-md border border-app bg-elev px-3 text-sm text-app"
              >
                <option value="free">Free</option>
                <option value="premium">Premium</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-muted">
              Poster image URL <span className="text-muted/60">(optional)</span>
            </label>
            <Input
              value={posterUrl}
              onChange={(e) => setPosterUrl(e.target.value)}
              placeholder="https://… (defaults to series cover)"
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button onClick={save} disabled={saving || !title.trim() || !videoUrl.trim()}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" /> Add episode
                </>
              )}
            </Button>
            <Button variant="ghost" asChild>
              <Link href={`/studio/${seriesId}`}>Cancel</Link>
            </Button>
          </div>
          <p className="text-xs text-muted">
            Saved as a <strong>draft</strong>. Toggle it published from the series page when ready.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
