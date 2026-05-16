'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Episode } from '@/lib/types';

export function EpisodeEditor({ episode, seriesId }: { episode: Episode; seriesId: string }) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: episode.title,
    synopsis: episode.synopsis ?? '',
    durationSeconds: episode.durationSeconds,
    orderIndex: episode.orderIndex,
    videoUrl: episode.videoUrl,
    posterUrl: episode.posterUrl ?? '',
    reflectionPrompt: episode.reflectionPrompt ?? '',
    tier: episode.tier,
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
      const res = await fetch(`/api/proxy/v1/creator/episodes/${episode.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json?.error ?? 'Could not save');
      router.push(`/creator/series/${seriesId}/edit`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  }

  async function destroy() {
    if (!confirm(`Delete episode "${episode.title}"?`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/proxy/v1/creator/episodes/${episode.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json?.error ?? 'Could not delete');
      router.push(`/creator/series/${seriesId}/edit`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete');
      setDeleting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Edit episode</CardTitle>
          <Button variant="ghost" size="sm" onClick={destroy} disabled={deleting}>
            <Trash2 className="h-4 w-4" /> {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Field label="Title"><Input value={form.title} onChange={(e) => set('title', e.target.value)} /></Field>
        <Field label="Synopsis"><Textarea rows={3} value={form.synopsis} onChange={(e) => set('synopsis', e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Duration (seconds)">
            <Input type="number" value={form.durationSeconds} onChange={(e) => set('durationSeconds', Number(e.target.value))} />
          </Field>
          <Field label="Order index">
            <Input type="number" value={form.orderIndex} onChange={(e) => set('orderIndex', Number(e.target.value))} />
          </Field>
        </div>
        <Field label="Video URL"><Input value={form.videoUrl} onChange={(e) => set('videoUrl', e.target.value)} /></Field>
        <Field label="Poster URL"><Input value={form.posterUrl} onChange={(e) => set('posterUrl', e.target.value)} /></Field>
        <Field label="Reflection prompt"><Textarea rows={2} value={form.reflectionPrompt} onChange={(e) => set('reflectionPrompt', e.target.value)} /></Field>
        <Field label="Tier">
          <select className="w-full h-10 rounded-md border border-app bg-elev px-3 text-sm" value={form.tier} onChange={(e) => set('tier', e.target.value as 'free' | 'premium')}>
            <option value="free">free</option>
            <option value="premium">premium</option>
          </select>
        </Field>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
          <Button variant="ghost" asChild><Link href={`/creator/series/${seriesId}/edit`}>Cancel</Link></Button>
        </div>
      </CardContent>
    </Card>
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
