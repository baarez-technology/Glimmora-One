'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input, Textarea } from './ui/input';
import { formatRelative } from '@/lib/utils';
import type { Reflection } from '@/lib/types';

const MOODS = ['', 'sad', 'anxious', 'angry', 'joyful', 'lonely', 'confused', 'hopeful'] as const;

export function ReflectionList({
  initial,
  q,
  mood,
}: {
  initial: Reflection[];
  q: string;
  mood: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [rows, setRows] = useState(initial);
  const [search, setSearch] = useState(q);
  const [moodFilter, setMoodFilter] = useState(mood);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<Reflection>>({});

  useEffect(() => setRows(initial), [initial]);

  useEffect(() => {
    const t = setTimeout(() => {
      const next = new URLSearchParams(searchParams.toString());
      if (search) next.set('q', search); else next.delete('q');
      if (moodFilter) next.set('mood', moodFilter); else next.delete('mood');
      router.replace(`${pathname}?${next.toString()}`);
    }, 250);
    return () => clearTimeout(t);
  }, [search, moodFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  async function save(id: string) {
    const res = await fetch(`/api/proxy/v1/reflection/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(draft),
    });
    const json = await res.json();
    if (json?.success && json.data) {
      setRows((curr) => curr.map((r) => (r.id === id ? json.data : r)));
      setEditing(null);
      setDraft({});
    }
  }

  async function destroy(id: string) {
    if (!confirm('Delete this reflection?')) return;
    const res = await fetch(`/api/proxy/v1/reflection/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json?.success) setRows((curr) => curr.filter((r) => r.id !== id));
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <Input
          placeholder="Search your reflections…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px]"
        />
        <select
          className="h-10 rounded-md border border-app bg-elev px-3 text-sm"
          value={moodFilter}
          onChange={(e) => setMoodFilter(e.target.value)}
        >
          {MOODS.map((m) => <option key={m} value={m}>{m || 'all moods'}</option>)}
        </select>
      </div>

      {rows.length === 0 && (
        <p className="text-muted text-sm">Nothing matches yet. The first sentence is the hardest.</p>
      )}

      {rows.map((r) => {
        const isEditing = editing === r.id;
        return (
          <div key={r.id} className="border-b border-app/60 last:border-0 pb-4 last:pb-0">
            <div className="flex items-center justify-between text-xs text-muted">
              <span>{formatRelative(r.createdAt)}</span>
              <div className="flex items-center gap-2">
                {r.mood && !isEditing && (
                  <span className="rounded-full bg-glimmer-100 dark:bg-glimmer-900/40 text-glimmer-700 dark:text-glimmer-200 px-2 py-0.5">
                    {r.mood}
                  </span>
                )}
                {!isEditing && <span>intensity {r.intensity}</span>}
                {!isEditing ? (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => { setEditing(r.id); setDraft({ content: r.content, mood: r.mood, intensity: r.intensity, tags: r.tags }); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => destroy(r.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => save(r.id)}>
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setEditing(null); setDraft({}); }}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
              </div>
            </div>
            {r.prompt && <p className="mt-2 text-sm italic text-muted">“{r.prompt}”</p>}
            {!isEditing && <p className="mt-1 leading-relaxed whitespace-pre-wrap">{r.content}</p>}
            {isEditing && (
              <div className="mt-2 space-y-2">
                <Textarea rows={4} value={draft.content ?? ''} onChange={(e) => setDraft({ ...draft, content: e.target.value })} />
                <div className="flex gap-2 flex-wrap">
                  <select
                    className="h-9 rounded-md border border-app bg-elev px-2 text-sm"
                    value={draft.mood ?? ''}
                    onChange={(e) => setDraft({ ...draft, mood: e.target.value || null })}
                  >
                    {MOODS.map((m) => <option key={m} value={m}>{m || 'mood: —'}</option>)}
                  </select>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={draft.intensity ?? 5}
                    onChange={(e) => setDraft({ ...draft, intensity: Number(e.target.value) })}
                    className="w-24"
                  />
                </div>
              </div>
            )}
            {!isEditing && r.insights && (
              <p className="mt-3 text-sm text-glimmer-600 dark:text-glimmer-300">✦ {r.insights}</p>
            )}
            {!isEditing && r.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {r.tags.map((t) => (
                  <span key={t} className="text-[10px] uppercase tracking-widest rounded-full border border-app px-2 py-0.5 text-muted">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
