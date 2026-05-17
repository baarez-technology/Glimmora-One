'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Film,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AutoTextarea } from '@/components/studio/auto-textarea';
import { CategorySelect } from '@/components/studio/category-select';
import type { StudioEpisode, StudioSeries } from '@/lib/types';

type Envelope<T> = { success: boolean; data: T; error?: string };

const ACCENTS = ['#c89b6c', '#a78b6b', '#b9805a', '#8b7355', '#d4a574', '#9c7b5e'];

export function SeriesEditor({ initial }: { initial: StudioSeries }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [title, setTitle] = useState(initial.title);
  const [tagline, setTagline] = useState(initial.tagline ?? '');
  const [description, setDescription] = useState(initial.description ?? '');
  const [category, setCategory] = useState(initial.category);
  const [accentColor, setAccentColor] = useState(initial.accentColor ?? '#c89b6c');
  const [coverUrl, setCoverUrl] = useState(initial.coverUrl ?? '');
  const [tier, setTier] = useState<'free' | 'premium'>(initial.tier);
  const [tags, setTags] = useState((initial.tags ?? []).join(', '));
  const [published, setPublished] = useState(initial.published);
  const [episodes, setEpisodes] = useState<StudioEpisode[]>(initial.episodes);

  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function save(opts: { publish?: boolean | null } = {}) {
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        title: title.trim(),
        tagline: tagline.trim() || null,
        description: description.trim() || null,
        category,
        accentColor,
        coverUrl: coverUrl.trim() || null,
        tier,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      };
      if (opts.publish !== undefined && opts.publish !== null) {
        body.published = opts.publish;
      }
      const res = await fetch(`/api/proxy/v1/studio/series/${initial.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const env = (await res.json()) as Envelope<StudioSeries>;
      if (!env.success) {
        setError(env.error || 'Could not save.');
        setSaving(false);
        return;
      }
      if (opts.publish !== undefined && opts.publish !== null) {
        setPublished(opts.publish);
      }
      setSavedAt(new Date().toLocaleTimeString());
      startTransition(() => router.refresh());
    } catch {
      setError('Network error while saving.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteSeries() {
    setSaving(true);
    try {
      await fetch(`/api/proxy/v1/studio/series/${initial.id}`, { method: 'DELETE' });
      router.push('/studio');
      router.refresh();
    } catch {
      setError("Couldn't delete. Try again.");
      setSaving(false);
    }
  }

  async function deleteEpisode(id: string) {
    const before = episodes;
    setEpisodes(episodes.filter((e) => e.id !== id));
    try {
      await fetch(`/api/proxy/v1/studio/episodes/${id}`, { method: 'DELETE' });
      startTransition(() => router.refresh());
    } catch {
      setEpisodes(before);
      setError("Couldn't delete the episode.");
    }
  }

  async function moveEpisode(index: number, dir: -1 | 1) {
    const next = [...episodes];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setEpisodes(next);
    try {
      await fetch(`/api/proxy/v1/studio/series/${initial.id}/reorder`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ episodeIds: next.map((e) => e.id) }),
      });
    } catch {
      setError("Couldn't save the new order.");
    }
  }

  async function toggleEpisodePublished(ep: StudioEpisode) {
    const before = episodes;
    setEpisodes(episodes.map((e) => (e.id === ep.id ? { ...e, published: !e.published } : e)));
    try {
      await fetch(`/api/proxy/v1/studio/episodes/${ep.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ published: !ep.published }),
      });
    } catch {
      setEpisodes(before);
      setError("Couldn't toggle the episode.");
    }
  }

  const missingVideo = episodes.filter((e) => !e.videoUrl || e.videoUrl === 'https://').length;
  const publishableEpisodes = episodes.filter(
    (e) => e.videoUrl && e.videoUrl !== 'https://',
  ).length;
  const canPublish = title.trim().length > 0 && publishableEpisodes > 0;

  return (
    <div className="relative px-4 lg:px-8 py-8 max-w-4xl space-y-6">
      <div className="glow-orb lg" style={{ top: '-180px', right: '-160px' }} />

      <Link href="/studio" className="text-sm text-muted hover:text-app inline-flex items-center gap-1">
        <ArrowLeft className="h-3 w-3" /> Back to studio
      </Link>

      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-glimmer-500">Edit series</p>
          <h1 className="font-serif text-3xl md:text-4xl mt-1">{title || 'Untitled'}</h1>
          <p className="text-xs text-muted mt-1">/{initial.slug}</p>
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
              <EyeOff className="h-4 w-4" /> Unpublish
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => save({ publish: true })}
              disabled={saving || !canPublish}
              title={!canPublish ? 'Add at least one episode with a video URL first.' : 'Publish'}
            >
              <Eye className="h-4 w-4" /> Publish
            </Button>
          )}
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-muted">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-muted">Tagline</label>
            <Input value={tagline} onChange={(e) => setTagline(e.target.value)} maxLength={120} />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-muted">Description</label>
            <AutoTextarea value={description} onChange={(e) => setDescription(e.target.value)} minRows={4} />
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
                  className={`h-9 w-9 rounded-full transition-all ${
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
            <Input value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="https://…" />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-muted">
              Tags <span className="text-muted/60">(comma-separated)</span>
            </label>
            <Input value={tags} onChange={(e) => setTags(e.target.value)} />
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
                  <Save className="h-4 w-4" /> Save details
                </>
              )}
            </Button>
            {savedAt && <span className="text-xs text-muted">Saved at {savedAt}</span>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-lg">Episodes</CardTitle>
            <p className="text-xs text-muted mt-1">
              {episodes.length} {episodes.length === 1 ? 'episode' : 'episodes'}
              {missingVideo > 0 && (
                <span className="text-amber-400 ml-2">
                  · {missingVideo} need a video URL
                </span>
              )}
            </p>
          </div>
          <Button asChild size="sm">
            <Link href={`/studio/${initial.id}/episodes/new`}>
              <Plus className="h-4 w-4" /> Add episode
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {episodes.length === 0 ? (
            <div className="text-center py-10 text-muted">
              <Film className="h-8 w-8 mx-auto opacity-50 mb-2" />
              <p className="text-sm">No episodes yet. Add the first one.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {episodes.map((ep, i) => {
                const noVideo = !ep.videoUrl || ep.videoUrl === 'https://';
                return (
                  <li
                    key={ep.id}
                    className="rounded-md border border-app bg-elev p-3 flex items-center gap-3"
                  >
                    <div className="flex flex-col">
                      <button
                        type="button"
                        onClick={() => moveEpisode(i, -1)}
                        disabled={i === 0}
                        className="text-muted hover:text-app disabled:opacity-30"
                        aria-label="Move up"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveEpisode(i, 1)}
                        disabled={i === episodes.length - 1}
                        className="text-muted hover:text-app disabled:opacity-30"
                        aria-label="Move down"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </div>
                    <span className="text-xs text-muted w-6 text-center">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{ep.title}</p>
                      <p className="text-xs text-muted truncate">
                        {ep.tier === 'premium' && <span className="text-glimmer-500">Premium · </span>}
                        {noVideo ? (
                          <span className="text-amber-400">No video URL yet</span>
                        ) : (
                          ep.synopsis || 'No synopsis yet'
                        )}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleEpisodePublished(ep)}
                      className={`text-[10px] uppercase tracking-widest rounded-full px-2 py-0.5 font-medium ${
                        ep.published
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-ink-200/40 text-muted'
                      }`}
                      disabled={noVideo}
                      title={noVideo ? 'Add a video URL first' : 'Toggle publish'}
                    >
                      {ep.published ? 'Published' : 'Draft'}
                    </button>
                    <Link
                      href={`/studio/${initial.id}/episodes/${ep.id}`}
                      className="text-muted hover:text-app p-1"
                      aria-label="Edit episode"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Delete "${ep.title}"? This cannot be undone.`)) {
                          deleteEpisode(ep.id);
                        }
                      }}
                      className="text-muted hover:text-red-400 p-1"
                      aria-label="Delete episode"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-red-400">Danger zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted">
            Deleting a series removes all its episodes and any watch progress customers have on
            them. There is no undo.
          </p>
          {!confirmDelete ? (
            <Button variant="outline" onClick={() => setConfirmDelete(true)} className="border-red-500/40">
              <Trash2 className="h-4 w-4" /> Delete this series
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <Button variant="destructive" onClick={deleteSeries} disabled={saving}>
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
