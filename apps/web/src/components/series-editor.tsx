'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Trash2, Pencil, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Series } from '@/lib/types';

const CATEGORIES = ['meditation', 'growth', 'emotional-intelligence', 'wisdom'];

export function SeriesEditor({ series }: { series: Series }) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: series.title,
    tagline: series.tagline ?? '',
    description: series.description ?? '',
    category: series.category,
    tier: series.tier,
    coverUrl: series.coverUrl ?? '',
    heroUrl: series.heroUrl ?? '',
    accentColor: series.accentColor ?? '#e9a932',
    tags: series.tags.join(', '),
    published: true,
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const body = {
        ...form,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      };
      const res = await fetch(`/api/proxy/v1/creator/series/${series.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json?.error ?? 'Could not save');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  }

  async function destroy() {
    if (!confirm(`Delete "${series.title}" and all its episodes? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/proxy/v1/creator/series/${series.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json?.error ?? 'Could not delete');
      router.push('/creator');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete');
      setDeleting(false);
    }
  }

  async function deleteEpisode(epId: string, epTitle: string) {
    if (!confirm(`Delete episode "${epTitle}"?`)) return;
    try {
      const res = await fetch(`/api/proxy/v1/creator/episodes/${epId}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json?.error ?? 'Could not delete');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete');
    }
  }

  async function togglePublish() {
    const next = !form.published;
    set('published', next);
    await fetch(`/api/proxy/v1/creator/series/${series.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ published: next }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle>Edit series — {series.title}</CardTitle>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={togglePublish}>
                {form.published ? 'Unpublish' : 'Publish'}
              </Button>
              <Button variant="ghost" size="sm" onClick={destroy} disabled={deleting}>
                <Trash2 className="h-4 w-4" /> {deleting ? 'Deleting…' : 'Delete series'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Title"><Input value={form.title} onChange={(e) => set('title', e.target.value)} /></Field>
          <Field label="Tagline"><Input value={form.tagline} onChange={(e) => set('tagline', e.target.value)} /></Field>
          <Field label="Description"><Textarea rows={4} value={form.description} onChange={(e) => set('description', e.target.value)} /></Field>
          <Field label="Category">
            <select className="w-full h-10 rounded-md border border-app bg-elev px-3 text-sm" value={form.category} onChange={(e) => set('category', e.target.value)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Tier">
            <select className="w-full h-10 rounded-md border border-app bg-elev px-3 text-sm" value={form.tier} onChange={(e) => set('tier', e.target.value as 'free' | 'premium')}>
              <option value="free">free</option>
              <option value="premium">premium</option>
            </select>
          </Field>
          <Field label="Cover image URL"><Input value={form.coverUrl} onChange={(e) => set('coverUrl', e.target.value)} /></Field>
          <Field label="Hero image URL"><Input value={form.heroUrl} onChange={(e) => set('heroUrl', e.target.value)} /></Field>
          <Field label="Tags (comma-separated)"><Input value={form.tags} onChange={(e) => set('tags', e.target.value)} /></Field>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
            <Button variant="ghost" asChild><Link href="/creator">Back to studio</Link></Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Episodes</CardTitle>
            <Button asChild size="sm">
              <Link href={`/creator/series/${series.id}/episodes/new`}><Plus className="h-4 w-4" /> Add episode</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {series.episodes.length === 0 && <p className="text-muted text-sm">No episodes yet.</p>}
          {series.episodes.map((ep) => (
            <div key={ep.id} className="flex items-center justify-between border-b border-app/40 last:border-0 py-2">
              <div>
                <p className="font-serif text-base">{ep.orderIndex + 1}. {ep.title}</p>
                <p className="text-xs text-muted">{ep.tier} · {Math.round(ep.durationSeconds / 60)}m</p>
              </div>
              <div className="flex gap-1">
                <Button asChild size="sm" variant="ghost">
                  <Link href={`/creator/series/${series.id}/episodes/${ep.id}/edit`}><Pencil className="h-4 w-4" /></Link>
                </Button>
                <Button size="sm" variant="ghost" onClick={() => deleteEpisode(ep.id, ep.title)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm text-muted">{label}</label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
