'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import type { CreatorApplication } from '@/lib/types';
import { formatRelative } from '@/lib/utils';

export function ApplicationsTable({ initial }: { initial: CreatorApplication[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);

  async function decide(id: string, decision: 'approve' | 'deny') {
    setBusy(id);
    try {
      const res = await fetch(`/api/proxy/v1/admin/applications/${id}/decide?decision=${decision}`, {
        method: 'POST',
      });
      const json = await res.json();
      if (json?.success && json.data) {
        setRows((curr) => curr.map((r) => (r.id === id ? json.data : r)));
        router.refresh();
      }
    } finally {
      setBusy(null);
    }
  }

  if (rows.length === 0) {
    return <p className="text-muted text-sm">No applications yet.</p>;
  }

  return (
    <div className="space-y-3">
      {rows.map((a) => (
        <div key={a.id} className="rounded-lg border border-app p-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">{a.username}</span>
                <span className="text-xs uppercase tracking-widest rounded-full px-2 py-0.5 border border-app text-muted">
                  {a.status}
                </span>
                <span className="text-xs text-muted">{formatRelative(a.createdAt)}</span>
              </div>
              <p className="mt-2 text-sm leading-relaxed">{a.pitch}</p>
              {a.sampleUrl && (
                <a
                  href={a.sampleUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-glimmer-500 hover:underline mt-1 inline-block"
                >
                  Sample / portfolio →
                </a>
              )}
            </div>
            {a.status === 'pending' && (
              <div className="flex gap-2 shrink-0">
                <Button size="sm" onClick={() => decide(a.id, 'approve')} disabled={busy === a.id}>
                  Approve
                </Button>
                <Button size="sm" variant="ghost" onClick={() => decide(a.id, 'deny')} disabled={busy === a.id}>
                  Deny
                </Button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
