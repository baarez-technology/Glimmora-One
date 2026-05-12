'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const MOODS = ['sad', 'anxious', 'angry', 'joyful', 'lonely', 'confused', 'hopeful', 'neutral'];

export default function NewReflectionPage() {
  const router = useRouter();
  const params = useSearchParams();
  const prompt = params.get('prompt') ?? '';
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<string>('neutral');
  const [intensity, setIntensity] = useState(5);
  const [tags, setTags] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!content.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/proxy/v1/reflection', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          content,
          prompt: prompt || null,
          mood,
          intensity,
          tags: tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json?.error ?? 'Could not save');
      router.push('/reflect');
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
          <CardTitle>A new reflection</CardTitle>
          <CardDescription>
            {prompt ? `“${prompt}”` : 'No agenda — just what\'s true right now.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            rows={8}
            placeholder="Start anywhere…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div>
            <p className="text-xs uppercase tracking-widest text-muted mb-2">Mood</p>
            <div className="flex flex-wrap gap-2">
              {MOODS.map((m) => (
                <button
                  key={m}
                  onClick={() => setMood(m)}
                  className={
                    'text-sm rounded-full border px-3 py-1 transition ' +
                    (mood === m
                      ? 'bg-glimmer-400 text-ink-950 border-glimmer-400'
                      : 'border-app text-muted hover:text-app')
                  }
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-muted mb-2">
              Intensity — {intensity}
            </p>
            <input
              type="range"
              min={1}
              max={10}
              value={intensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
              className="w-full accent-glimmer-400"
            />
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-muted mb-2">Threads (comma-separated)</p>
            <Input placeholder="e.g. work, sleep, family" value={tags} onChange={(e) => setTags(e.target.value)} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button onClick={save} disabled={saving || !content.trim()}>
              {saving ? 'Saving…' : 'Save reflection'}
            </Button>
            <Button variant="ghost" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
