'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatRelative, cn } from '@/lib/utils';
import type { CreatorApplication } from '@/lib/types';

const STATUSES = ['pending', 'approved', 'rejected'] as const;

export function ApplicationsReview({ initial }: { initial: CreatorApplication[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [filter, setFilter] = useState<typeof STATUSES[number]>('pending');
  const [openId, setOpenId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const r = await fetch(`/api/proxy/v1/moderate/applications?status_filter=${filter}`);
      const j = await r.json();
      if (j?.success) setRows(j.data);
    })();
  }, [filter]);

  async function decide(id: string, decision: 'approve' | 'reject') {
    setBusy(true);
    try {
      const r = await fetch(`/api/proxy/v1/moderate/applications/${id}/decide`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ decision, note: note || null }),
      });
      const j = await r.json();
      if (j?.success) {
        setRows((curr) => curr.map((a) => (a.id === id ? j.data : a)));
        setNote('');
        setOpenId(null);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  const filtered = rows.filter((r) => r.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex gap-1 text-xs">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              'rounded-full px-3 py-1 border transition capitalize',
              filter === s
                ? 'border-glimmer-400 bg-glimmer-100/60 dark:bg-glimmer-900/30 text-glimmer-700 dark:text-glimmer-200'
                : 'border-app text-muted hover:text-app',
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {filtered.length === 0 && <p className="text-muted text-sm">No {filter} applications.</p>}

      <div className="space-y-3">
        {filtered.map((a) => (
          <Card key={a.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <CardTitle>{a.fullName}</CardTitle>
                  <p className="text-xs text-muted mt-1">
                    @{a.username} · {a.email} · submitted {formatRelative(a.createdAt)}
                  </p>
                </div>
                <span
                  className={cn(
                    'text-[10px] uppercase tracking-widest rounded-full px-2 py-0.5',
                    a.status === 'pending' && 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200',
                    a.status === 'approved' && 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200',
                    a.status === 'rejected' && 'bg-rose-100 text-rose-900 dark:bg-rose-900/40 dark:text-rose-200',
                  )}
                >
                  {a.status}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {a.pitch && <p className="leading-relaxed whitespace-pre-wrap">{a.pitch}</p>}

              {a.links?.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted mb-1">Links</p>
                  <ul className="space-y-1">
                    {a.links.map((l) => (
                      <li key={l}>
                        <a href={l} target="_blank" rel="noreferrer" className="text-glimmer-600 dark:text-glimmer-300 hover:underline inline-flex items-center gap-1">
                          {l} <ExternalLink className="h-3 w-3" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {a.attachments?.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted mb-1">Attachments</p>
                  <ul className="space-y-1">
                    {a.attachments.map((l) => (
                      <li key={l}>
                        <a href={l} target="_blank" rel="noreferrer" className="text-glimmer-600 dark:text-glimmer-300 hover:underline inline-flex items-center gap-1">
                          {l} <ExternalLink className="h-3 w-3" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {a.decisionNote && (
                <p className="text-xs italic text-muted">
                  Decision note: {a.decisionNote}
                </p>
              )}

              {a.status === 'pending' && (
                <>
                  {openId === a.id ? (
                    <div className="space-y-2 pt-2 border-t border-app">
                      <Textarea
                        rows={3}
                        placeholder="A short note for the applicant (optional)…"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button onClick={() => decide(a.id, 'approve')} disabled={busy} size="sm">
                          <Check className="h-4 w-4" /> Approve
                        </Button>
                        <Button onClick={() => decide(a.id, 'reject')} disabled={busy} size="sm" variant="ghost">
                          <X className="h-4 w-4" /> Reject
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => { setOpenId(null); setNote(''); }}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button size="sm" onClick={() => setOpenId(a.id)}>
                      Review and decide
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
