'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { MessageSquare, Plus, Search, Trash2 } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { cn, formatRelative } from '@/lib/utils';
import type { ConversationSummary } from '@/lib/types';

export function ConversationDrawer({
  initial,
  activeId,
}: {
  initial: ConversationSummary[];
  activeId?: string;
}) {
  const [rows, setRows] = useState(initial);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      const url = q ? `/api/proxy/v1/ai/conversations?q=${encodeURIComponent(q)}` : '/api/proxy/v1/ai/conversations';
      const res = await fetch(url);
      const json = await res.json();
      if (json?.success && Array.isArray(json.data)) setRows(json.data);
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  async function destroy(id: string) {
    if (!confirm('Delete this conversation?')) return;
    const res = await fetch(`/api/proxy/v1/ai/conversations/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json?.success) setRows((curr) => curr.filter((r) => r.id !== id));
  }

  return (
    <>
      <aside
        className={cn(
          'hidden lg:flex w-72 shrink-0 flex-col border-r border-app/60 bg-elev/40 p-3 h-[calc(100vh-3.5rem)] overflow-y-auto',
        )}
      >
        <DrawerBody
          rows={rows}
          q={q}
          setQ={setQ}
          activeId={activeId}
          destroy={destroy}
        />
      </aside>

      {/* Mobile: toggle button */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed bottom-20 left-3 z-30 rounded-full border border-app bg-elev/90 backdrop-blur p-3 shadow-soft"
        aria-label="Open conversations"
      >
        <MessageSquare className="h-4 w-4" />
      </button>
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-ink-950/40" onClick={() => setOpen(false)} />
          <aside className="relative w-72 max-w-[85%] bg-app border-r border-app/60 p-3 overflow-y-auto">
            <DrawerBody
              rows={rows}
              q={q}
              setQ={setQ}
              activeId={activeId}
              destroy={destroy}
              onPick={() => setOpen(false)}
            />
          </aside>
        </div>
      )}
    </>
  );
}

function DrawerBody({
  rows,
  q,
  setQ,
  activeId,
  destroy,
  onPick,
}: {
  rows: ConversationSummary[];
  q: string;
  setQ: (s: string) => void;
  activeId?: string;
  destroy: (id: string) => void;
  onPick?: () => void;
}) {
  return (
    <>
      <div className="flex items-center gap-2 mb-3">
        <Button asChild size="sm" className="flex-1">
          <Link href="/companion"><Plus className="h-4 w-4" /> New chat</Link>
        </Button>
      </div>
      <div className="relative mb-3">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search your conversations"
          className="pl-7 h-9 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        {rows.length === 0 && <p className="text-xs text-muted px-2">No conversations match.</p>}
        {rows.map((c) => (
          <div
            key={c.id}
            className={cn(
              'group flex items-start gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
              activeId === c.id ? 'bg-glimmer-100/60 dark:bg-glimmer-900/30' : 'hover:bg-ink-100/60 dark:hover:bg-ink-800/40',
            )}
          >
            <Link href={`/companion?c=${c.id}`} onClick={onPick} className="flex-1 min-w-0">
              <p className="truncate">{c.title}</p>
              <p className="truncate text-xs text-muted">
                {c.lastMessagePreview ?? '—'} · {formatRelative(c.updatedAt)}
              </p>
            </Link>
            <button
              onClick={() => destroy(c.id)}
              className="opacity-0 group-hover:opacity-100 text-muted hover:text-app shrink-0"
              aria-label="Delete conversation"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
