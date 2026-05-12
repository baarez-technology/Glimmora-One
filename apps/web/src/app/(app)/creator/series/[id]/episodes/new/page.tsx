'use client';

import { useRouter } from 'next/navigation';
import { use, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function NewEpisodePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: seriesId } = use(params);
  const router = useRouter();
  const [form, setForm] = useState({
    title: '',
    slug: '',
    synopsis: '',
    durationSeconds: 0,
    orderIndex: 0,
    videoUrl: '',
    posterUrl: '',
    reflectionPrompt: '',
    tier: 'free',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const body = {
        seriesId,
        ...form,
        slug: form.slug.toLowerCase().replace(/[^a-z0-9-]+/g, '-'),
      };
      const res = await fetch('/api/proxy/v1/creator/episodes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json?.error ?? 'Could not save');
      router.push('/creator');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="px-4 lg:px-8 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Add an episode</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm text-muted">Title</label>
            <Input className="mt-1.5" value={form.title} onChange={(e) => set('title', e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-muted">Slug</label>
            <Input className="mt-1.5" value={form.slug} onChange={(e) => set('slug', e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-muted">Synopsis</label>
            <Textarea rows={3} className="mt-1.5" value={form.synopsis} onChange={(e) => set('synopsis', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-muted">Duration (seconds)</label>
              <Input type="number" className="mt-1.5" value={form.durationSeconds}
                     onChange={(e) => set('durationSeconds', Number(e.target.value))} />
            </div>
            <div>
              <label className="text-sm text-muted">Order index</label>
              <Input type="number" className="mt-1.5" value={form.orderIndex}
                     onChange={(e) => set('orderIndex', Number(e.target.value))} />
            </div>
          </div>
          <div>
            <label className="text-sm text-muted">Video URL (HLS .m3u8 or mp4)</label>
            <Input className="mt-1.5" value={form.videoUrl} onChange={(e) => set('videoUrl', e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-muted">Poster URL</label>
            <Input className="mt-1.5" value={form.posterUrl} onChange={(e) => set('posterUrl', e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-muted">Reflection prompt (asked after viewing)</label>
            <Textarea rows={2} className="mt-1.5" value={form.reflectionPrompt}
                      onChange={(e) => set('reflectionPrompt', e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-muted">Tier</label>
            <select
              className="mt-1.5 w-full h-10 rounded-md border border-app bg-elev px-3 text-sm"
              value={form.tier}
              onChange={(e) => set('tier', e.target.value)}
            >
              <option value="free">free</option>
              <option value="premium">premium</option>
            </select>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button onClick={save} disabled={saving || !form.title || !form.slug || !form.videoUrl}>
              {saving ? 'Saving…' : 'Add episode'}
            </Button>
            <Button variant="ghost" onClick={() => router.back()}>Cancel</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
