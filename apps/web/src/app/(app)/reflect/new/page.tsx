'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

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

  // Custom mood UI state
  const [customDraft, setCustomDraft] = useState('');
  const [editingCustom, setEditingCustom] = useState(false);
  const customInputRef = useRef<HTMLInputElement>(null);
  const isCustom = !MOODS.includes(mood) && mood !== '';

  useEffect(() => {
    if (editingCustom) {
      // focus + select existing text when the editor opens
      requestAnimationFrame(() => customInputRef.current?.focus());
    }
  }, [editingCustom]);

  function commitCustom() {
    const v = customDraft.trim().toLowerCase();
    if (!v) {
      setEditingCustom(false);
      return;
    }
    if (v.length > 24) {
      setError('Custom mood must be 24 characters or less.');
      return;
    }
    setMood(v);
    setEditingCustom(false);
    setError(null);
  }

  function openCustomEditor() {
    setCustomDraft(isCustom ? mood : '');
    setEditingCustom(true);
  }

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
            <div className="flex flex-wrap gap-2 items-center">
              {MOODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMood(m)}
                  className={cn(
                    'text-sm rounded-full border px-3 py-1 transition',
                    mood === m
                      ? 'bg-glimmer-400 text-ink-950 border-glimmer-400'
                      : 'border-app text-muted hover:text-app',
                  )}
                >
                  {m}
                </button>
              ))}

              {/* Custom mood — selected state shows the typed value with an edit + remove */}
              {isCustom && !editingCustom && (
                <span
                  className="inline-flex items-center gap-1.5 text-sm rounded-full px-3 py-1 bg-glimmer-400 text-ink-950 border border-glimmer-400"
                  title="Custom mood — click to edit"
                >
                  <button
                    type="button"
                    onClick={openCustomEditor}
                    className="hover:underline underline-offset-2"
                  >
                    {mood}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMood('neutral')}
                    aria-label="Remove custom mood"
                    className="hover:bg-ink-950/15 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {/* Inline editor */}
              {editingCustom && (
                <span className="inline-flex items-center gap-1 text-sm rounded-full border border-glimmer-400 bg-elev pl-3 pr-1 py-0.5">
                  <input
                    ref={customInputRef}
                    value={customDraft}
                    onChange={(e) => setCustomDraft(e.target.value.slice(0, 24))}
                    placeholder="how do you feel?"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); commitCustom(); }
                      if (e.key === 'Escape') { e.preventDefault(); setEditingCustom(false); }
                    }}
                    className="bg-transparent focus:outline-none w-32 text-app placeholder:text-muted text-sm"
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={commitCustom}
                    disabled={!customDraft.trim()}
                    aria-label="Save custom mood"
                    className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-glimmer-400 text-ink-950 disabled:opacity-40 hover:bg-glimmer-300"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingCustom(false)}
                    aria-label="Cancel"
                    className="inline-flex items-center justify-center h-6 w-6 rounded-full text-muted hover:text-app"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              )}

              {/* "+ Custom" trigger — hidden while editing OR while a custom is already selected
                  (those states already give the user a way back). */}
              {!editingCustom && !isCustom && (
                <button
                  type="button"
                  onClick={openCustomEditor}
                  className="inline-flex items-center gap-1 text-sm rounded-full border border-dashed border-glimmer-400/60 text-glimmer-600 dark:text-glimmer-300 px-3 py-1 hover:bg-glimmer-400/10 transition"
                >
                  <Plus className="h-3.5 w-3.5" /> Custom
                </button>
              )}
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
            <p className="text-xs uppercase tracking-widest text-muted mb-2">Causes (comma-separated)</p>
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
