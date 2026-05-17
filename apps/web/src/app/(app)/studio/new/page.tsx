'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Plus, Sparkles, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, Textarea } from '@/components/ui/input';
import { AutoTextarea } from '@/components/studio/auto-textarea';
import { CategorySelect } from '@/components/studio/category-select';
import type {
  AIOutlineEpisode,
  AISeriesFromTitle,
  AISeriesOutline,
  StudioEpisode,
  StudioSeries,
} from '@/lib/types';

type Envelope<T> = { success: boolean; data: T; error?: string };

const ACCENTS = ['#c89b6c', '#a78b6b', '#b9805a', '#8b7355', '#d4a574', '#9c7b5e'];

export default function NewSeriesPage() {
  const router = useRouter();
  const [step, setStep] = useState<'title' | 'details'>('title');

  // Step 1 — title + AI generate
  const [title, setTitle] = useState('');
  const [hint, setHint] = useState('');
  const [outlineCount, setOutlineCount] = useState(6);
  const [generating, setGenerating] = useState<null | 'fields' | 'outline'>(null);
  const [outline, setOutline] = useState<AIOutlineEpisode[] | null>(null);
  const [outlinePicks, setOutlinePicks] = useState<Set<number>>(new Set());

  // Step 2 — full form
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('wisdom');
  const [accentColor, setAccentColor] = useState('#c89b6c');
  const [coverUrl, setCoverUrl] = useState('');
  const [tier, setTier] = useState<'free' | 'premium'>('free');
  const [tags, setTags] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function generateFields() {
    if (!title.trim()) return;
    setGenerating('fields');
    setError(null);
    try {
      const res = await fetch('/api/proxy/v1/studio/ai/series-from-title', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), hint: hint.trim() || undefined }),
      });
      const env = (await res.json()) as Envelope<AISeriesFromTitle>;
      if (env.success && env.data) {
        setTagline(env.data.tagline);
        setDescription(env.data.description);
        setCategory(env.data.category);
        setAccentColor(env.data.accentColor);
        setTags(env.data.tags.join(', '));
        setStep('details');
      }
    } catch {
      setError("Couldn't reach the AI. Skip to details and write your own.");
      setStep('details');
    } finally {
      setGenerating(null);
    }
  }

  async function generateOutline() {
    if (!title.trim()) return;
    setGenerating('outline');
    setError(null);
    try {
      const res = await fetch('/api/proxy/v1/studio/ai/series-outline', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          hint: hint.trim() || undefined,
          episodeCount: outlineCount,
        }),
      });
      const env = (await res.json()) as Envelope<AISeriesOutline>;
      if (env.success && env.data) {
        setOutline(env.data.episodes);
        setOutlinePicks(new Set(env.data.episodes.map((_, i) => i)));
        if (!description) setDescription(env.data.description);
      }
    } catch {
      setError('Outline failed. Try again or skip.');
    } finally {
      setGenerating(null);
    }
  }

  function togglePick(i: number) {
    const next = new Set(outlinePicks);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    setOutlinePicks(next);
  }

  async function save() {
    setError(null);
    setSaving(true);
    try {
      const seriesRes = await fetch('/api/proxy/v1/studio/series', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          tagline: tagline.trim() || null,
          description: description.trim() || null,
          category,
          accentColor,
          coverUrl: coverUrl.trim() || null,
          tier,
          tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        }),
      });
      const env = (await seriesRes.json()) as Envelope<StudioSeries>;
      if (!env.success || !env.data) {
        setError(env.error || 'Could not create series.');
        setSaving(false);
        return;
      }
      const seriesId = env.data.id;

      // If the user picked outline episodes, create stub episodes for each.
      // We give them an empty video_url placeholder so the creator can fill it
      // in later; the form will surface that as a required edit before publish.
      if (outline) {
        const picked = outline.filter((_, i) => outlinePicks.has(i));
        for (const ep of picked) {
          await fetch(`/api/proxy/v1/studio/series/${seriesId}/episodes`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              title: ep.title,
              synopsis: ep.synopsis,
              videoUrl: 'https://',
              tier,
              durationSeconds: 0,
            }),
          });
        }
      }

      router.push(`/studio/${seriesId}`);
      router.refresh();
    } catch (e) {
      setError('Something went wrong saving the series.');
      setSaving(false);
    }
  }

  return (
    <div className="relative px-4 lg:px-8 py-8 max-w-3xl space-y-6">
      <div className="glow-orb lg" style={{ top: '-180px', right: '-160px' }} />

      <Link href="/studio" className="text-sm text-muted hover:text-app inline-flex items-center gap-1">
        <ArrowLeft className="h-3 w-3" /> Back to studio
      </Link>

      <header>
        <p className="text-sm uppercase tracking-[0.18em] text-glimmer-500">New series</p>
        <h1 className="font-serif text-3xl md:text-4xl mt-1">
          {step === 'title' ? 'Start with a title.' : 'Shape your series.'}
        </h1>
        <p className="text-muted mt-3 leading-relaxed">
          {step === 'title'
            ? 'Give it a name. Optionally, drop a line about who it\'s for. The AI will sketch a tagline, description, and outline you can keep or rewrite.'
            : 'These are AI drafts. Edit anything that doesn\'t sound like you.'}
        </p>
      </header>

      {step === 'title' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Title</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-muted">Series title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder='e.g. "Becoming without pressure"'
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-muted">
                Optional hint <span className="text-muted/60">(who is this for, what's the feeling)</span>
              </label>
              <Textarea
                value={hint}
                onChange={(e) => setHint(e.target.value)}
                placeholder='e.g. "for people in their twenties who feel behind"'
                rows={2}
              />
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button onClick={generateFields} disabled={!title.trim() || generating !== null}>
                {generating === 'fields' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Drafting…
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" /> Generate tagline + description
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setStep('details')} disabled={!title.trim()}>
                Skip — I'll write it
              </Button>
            </div>

            <div className="pt-4 border-t border-app space-y-3">
              <p className="text-xs uppercase tracking-widest text-glimmer-500">
                <Sparkles className="inline h-3 w-3 mr-1" /> Or, sketch an outline
              </p>
              <p className="text-xs text-muted">
                Give us an episode count, and the AI will propose titles + one-line summaries.
                You pick which ones to keep, and they'll be created as drafts.
              </p>
              <div className="flex items-center gap-3">
                <label className="text-xs text-muted">Episodes:</label>
                <Input
                  type="number"
                  min={2}
                  max={12}
                  value={outlineCount}
                  onChange={(e) => setOutlineCount(Math.min(12, Math.max(2, Number(e.target.value) || 6)))}
                  className="w-20"
                />
                <Button
                  variant="outline"
                  onClick={generateOutline}
                  disabled={!title.trim() || generating !== null}
                  size="sm"
                >
                  {generating === 'outline' ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" /> Thinking…
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-3 w-3" /> Sketch outline
                    </>
                  )}
                </Button>
              </div>

              {outline && outline.length > 0 && (
                <div className="space-y-2 pt-2">
                  <p className="text-xs text-muted">
                    Untick any episodes you don't want. The rest will be created as drafts.
                  </p>
                  <ul className="space-y-2">
                    {outline.map((ep, i) => (
                      <li
                        key={i}
                        className={`rounded-md border p-3 transition-colors cursor-pointer ${
                          outlinePicks.has(i)
                            ? 'border-glimmer-400/60 bg-glimmer-400/5'
                            : 'border-app bg-elev opacity-60'
                        }`}
                        onClick={() => togglePick(i)}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={outlinePicks.has(i)}
                            onChange={() => togglePick(i)}
                            className="mt-1 accent-glimmer-400"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-app">{ep.title}</p>
                            <p className="text-xs text-muted mt-0.5">{ep.synopsis}</p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}
          </CardContent>
        </Card>
      )}

      {step === 'details' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {(tagline || description) && (
              <div className="rounded-md border border-glimmer-400/30 bg-glimmer-400/5 px-3 py-2">
                <p className="text-[11px] uppercase tracking-widest text-glimmer-500">
                  <Sparkles className="inline h-3 w-3 mr-1" /> AI draft — review before publishing
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-muted">Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-muted">Tagline</label>
              <Input
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="One quiet sentence under 60 chars"
                maxLength={120}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-muted">Description</label>
              <AutoTextarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Two or three short sentences about what's inside."
                minRows={4}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-muted">Category</label>
                <CategorySelect value={category} onChange={setCategory} />
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
              <label className="text-xs uppercase tracking-widest text-muted">Accent color</label>
              <div className="flex gap-2 flex-wrap">
                {ACCENTS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setAccentColor(c)}
                    className={`h-9 w-9 rounded-full ring-offset-2 ring-offset-transparent transition-all ${
                      accentColor === c ? 'ring-2 ring-glimmer-400 scale-110' : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{ background: c }}
                    aria-label={c}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-muted">Cover image URL</label>
              <Input
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder="https://…"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-muted">
                Tags <span className="text-muted/60">(comma-separated)</span>
              </label>
              <Input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="meditation, stillness, awareness"
              />
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <div className="flex gap-3 pt-2">
              <Button onClick={save} disabled={saving || !title.trim()}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" /> Create draft series
                  </>
                )}
              </Button>
              <Button variant="ghost" onClick={() => setStep('title')} disabled={saving}>
                Back
              </Button>
            </div>
            <p className="text-xs text-muted">
              Your series will be saved as a <strong>draft</strong>. Customers won't see it until
              you flip the Publish toggle on the next screen.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
