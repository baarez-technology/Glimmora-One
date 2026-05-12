'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const CATEGORIES = ['meditation', 'growth', 'emotional-intelligence', 'wisdom'];

export default function NewSeriesPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '',
    slug: '',
    tagline: '',
    description: '',
    category: 'wisdom',
    tier: 'free',
    coverUrl: '',
    heroUrl: '',
    accentColor: '#e9a932',
    tags: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save() {
    if (!form.title.trim() || !form.slug.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const body = {
        ...form,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        slug: form.slug.toLowerCase().replace(/[^a-z0-9-]+/g, '-'),
      };
      const res = await fetch('/api/proxy/v1/creator/series', {
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
          <CardTitle>A new series</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Title">
            <Input value={form.title} onChange={(e) => set('title', e.target.value)} />
          </Field>
          <Field label="Slug" hint="lowercase, hyphenated; this lives in the URL">
            <Input
              value={form.slug}
              onChange={(e) => set('slug', e.target.value)}
              placeholder="becoming-without-pressure"
            />
          </Field>
          <Field label="Tagline">
            <Input value={form.tagline} onChange={(e) => set('tagline', e.target.value)} />
          </Field>
          <Field label="Description">
            <Textarea rows={4} value={form.description} onChange={(e) => set('description', e.target.value)} />
          </Field>
          <Field label="Category">
            <select
              className="w-full h-10 rounded-md border border-app bg-elev px-3 text-sm"
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Tier">
            <select
              className="w-full h-10 rounded-md border border-app bg-elev px-3 text-sm"
              value={form.tier}
              onChange={(e) => set('tier', e.target.value)}
            >
              <option value="free">free</option>
              <option value="premium">premium</option>
            </select>
          </Field>
          <Field label="Cover image URL">
            <Input value={form.coverUrl} onChange={(e) => set('coverUrl', e.target.value)} placeholder="https://…" />
          </Field>
          <Field label="Hero image URL">
            <Input value={form.heroUrl} onChange={(e) => set('heroUrl', e.target.value)} placeholder="https://…" />
          </Field>
          <Field label="Tags (comma-separated)">
            <Input value={form.tags} onChange={(e) => set('tags', e.target.value)} placeholder="stillness, grief" />
          </Field>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button onClick={save} disabled={saving || !form.title || !form.slug}>
              {saving ? 'Saving…' : 'Create series'}
            </Button>
            <Button variant="ghost" onClick={() => router.back()}>Cancel</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm text-muted">{label}</label>
      <div className="mt-1.5">{children}</div>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
