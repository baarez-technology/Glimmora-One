'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Save, Sparkles, Trash2, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, Textarea } from '@/components/ui/input';
import type { AIEpisodeFromTitle, StudioEpisode } from '@/lib/types';

type Envelope<T> = { success: boolean; data: T; error?: string };

export function EpisodeEditor({
  seriesId,
  initial,
}: {
  seriesId: string;
  initial: StudioEpisode;
}) {
  const router = useRouter();

  const [title, setTitle] = useState(initial.title);
  const [synopsis, setSynopsis] = useState(initial.synopsis ?? '');
  const [reflectionPrompt, setReflectionPrompt] = useState(initial.reflectionPrompt ?? '');
  const [videoUrl, setVideoUrl] = useState(initial.videoUrl === 'https://' ? '' : initial.videoUrl);
  const [posterUrl, setPosterUrl] = useState(initial.posterUrl ?? '');
  const [durationSeconds, setDurationSeconds] = useState(initial.durationSeconds);
  const [tier, setTier] = useState<'free' | 'premium'>(initial.tier);
  const [published, setPublished] = useState(initial.published);

  const [aiUsed, setAiUsed] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function generatePrompt() {
    if (!title.trim() && !synopsis.trim()) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/proxy/v1/studio/ai/episode-from-title', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title: title.trim() || 'episode', seriesId }),
      });
      const env = (await res.json()) as Envelope<AIEpisodeFromTitle>;
      if (env.success && env.data) {
        setReflectionPrompt(env.data.reflectionPrompt);
        if (!synopsis.trim()) setSynopsis(env.data.synopsis);
        setAiUsed(true);
      }
    } catch {
      setError("Couldn't reach the AI.");
    } finally {
      setGenerating(false);
    }
  }

  async function save(opts: { publish?: boolean | null } = {}) {
    if (!title.trim() || !videoUrl.trim()) {
      setError('Title and video URL are required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        title: title.trim(),
        synopsis: synopsis.trim() || null,
        reflectionPrompt: reflectionPrompt.trim() || null,
        videoUrl: videoUrl.trim(),
        posterUrl: posterUrl.trim() || null,
        durationSeconds,
        tier,
      };
      if (opts.publish !== undefined && opts.publish !== null) {
        body.published = opts.publish;
      }
      const res = await fetch(`/api/proxy/v1/studio/episodes/${initial.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const env = (await res.json()) as Envelope<StudioEpisode>;
      if (!env.success) {
        setError(env.error || 'Could not save.');
        setSaving(false);
        return;
      }
      if (opts.publish !== undefined && opts.publish !== null) {
        setPublished(opts.publish);
      }
      setSavedAt(new Date().toLocaleTimeString());
    } catch {
      setError('Network error while saving.');
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    setSaving(true);
    try {
      await fetch(`/api/proxy/v1/studio/episodes/${initial.id}`, { method: 'DELETE' });
      router.push(`/studio/${seriesId}`);
      router.refresh();
    } catch {
      setError("Couldn't delete. Try again.");
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

      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-glimmer-500">Edit episode</p>
          <h1 className="font-serif text-3xl md:text-4xl mt-1">{title || 'Untitled'}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] uppercase tracking-widest rounded-full px-2 py-1 font-medium ${
              published
                ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30'
                : 'bg-ink-200/40 text-muted ring-1 ring-app/40'
            }`}
          >
            {published ? 'Published' : 'Draft'}
          </span>
          {published ? (
            <Button variant="outline" size="sm" onClick={() => save({ publish: false })} disabled={saving}>
              Unpublish
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => save({ publish: true })}
              disabled={saving || !videoUrl.trim()}
              title={!videoUrl.trim() ? 'Add a video URL first.' : 'Publish'}
            >
              Publish
            </Button>
          )}
        </div>
      </header>

      <Card>
        <CardContent className="space-y-5 pt-6">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-muted">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
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
              rows={3}
              placeholder="One or two short sentences."
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs uppercase tracking-widest text-muted">
                Closing reflection prompt
              </label>
              <button
                type="button"
                onClick={generatePrompt}
                disabled={generating || (!title.trim() && !synopsis.trim())}
                className="text-[11px] text-glimmer-500 hover:underline disabled:opacity-40 inline-flex items-center gap-1"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" /> Thinking
                  </>
                ) : (
                  <>
                    <Wand2 className="h-3 w-3" /> Suggest a question
                  </>
                )}
              </button>
            </div>
            <Textarea
              value={reflectionPrompt}
              onChange={(e) => setReflectionPrompt(e.target.value)}
              rows={2}
              placeholder="One open question the viewer sits with after watching."
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-muted">
              Video URL <span className="text-red-400">*</span>
            </label>
            <Input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://…"
            />
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
              placeholder="https://…"
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex items-center gap-3 pt-2">
            <Button onClick={() => save()} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" /> Save changes
                </>
              )}
            </Button>
            {savedAt && <span className="text-xs text-muted">Saved at {savedAt}</span>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-red-400">Danger zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted">
            Deleting this episode removes any customer watch progress on it. There is no undo.
          </p>
          {!confirmDelete ? (
            <Button variant="outline" onClick={() => setConfirmDelete(true)} className="border-red-500/40">
              <Trash2 className="h-4 w-4" /> Delete episode
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <Button variant="destructive" onClick={remove} disabled={saving}>
                Confirm delete
              </Button>
              <Button variant="ghost" onClick={() => setConfirmDelete(false)} disabled={saving}>
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
