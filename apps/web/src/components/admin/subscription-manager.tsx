'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Subscription, Tier } from '@/lib/types';

type Draft = {
  tier: Tier;
  startDate: string; // yyyy-mm-dd
  endDate: string;
  note: string;
};

function isoToDate(s: string): string {
  return s.slice(0, 10);
}

function dateToIso(s: string): string {
  // treat input as midnight UTC
  return new Date(s + 'T00:00:00Z').toISOString();
}

const emptyDraft = (): Draft => {
  const now = new Date();
  const inMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
  return {
    tier: 'premium',
    startDate: isoToDate(now.toISOString()),
    endDate: isoToDate(inMonth.toISOString()),
    note: '',
  };
};

export function SubscriptionManager({ userId, initial }: { userId: string; initial: Subscription[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function openAdd() {
    setEditing(null);
    setDraft(emptyDraft());
    setErr(null);
    setOpen(true);
  }

  function openEdit(s: Subscription) {
    setEditing(s);
    setDraft({
      tier: s.tier,
      startDate: isoToDate(s.startDate),
      endDate: isoToDate(s.endDate),
      note: s.note ?? '',
    });
    setErr(null);
    setOpen(true);
  }

  async function save() {
    setBusy(true);
    setErr(null);
    try {
      const payload = {
        tier: draft.tier,
        startDate: dateToIso(draft.startDate),
        endDate: dateToIso(draft.endDate),
        note: draft.note || null,
      };
      const url = editing
        ? `/api/proxy/v1/admin/subscriptions/${editing.id}`
        : `/api/proxy/v1/admin/customers/${userId}/subscriptions`;
      const method = editing ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (!res.ok || !j.success) throw new Error(j?.detail ?? j?.error ?? 'Could not save');
      if (editing) {
        setRows((curr) => curr.map((r) => (r.id === editing.id ? j.data : r)));
      } else {
        setRows((curr) => [j.data, ...curr]);
      }
      setOpen(false);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not save');
    } finally {
      setBusy(false);
    }
  }

  async function destroy(s: Subscription) {
    if (!confirm(`Delete this ${s.tier} subscription?`)) return;
    const res = await fetch(`/api/proxy/v1/admin/subscriptions/${s.id}`, { method: 'DELETE' });
    const j = await res.json();
    if (j?.success) {
      setRows((curr) => curr.filter((r) => r.id !== s.id));
      router.refresh();
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Subscriptions</CardTitle>
          <Button size="sm" onClick={openAdd}>
            <Plus className="h-4 w-4" /> Add subscription
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.length === 0 && (
          <p className="text-muted text-sm">No subscriptions yet. Add one to grant a paid tier.</p>
        )}
        <div className="space-y-2">
          {rows.map((s) => (
            <div
              key={s.id}
              className={cn(
                'flex items-center justify-between rounded-md border border-app p-3',
                s.isActive && 'border-glimmer-400/60 bg-glimmer-50 dark:bg-glimmer-900/15',
              )}
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium capitalize">
                  {s.tier}
                  {s.isActive && (
                    <span className="ml-2 text-[9px] uppercase tracking-widest rounded-full bg-glimmer-400 text-ink-950 px-1.5 py-0.5 font-medium">
                      active
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted mt-0.5">
                  {new Date(s.startDate).toLocaleDateString()} → {new Date(s.endDate).toLocaleDateString()}
                </p>
                {s.note && <p className="text-xs text-muted mt-1 italic">"{s.note}"</p>}
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => openEdit(s)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => destroy(s)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      {open && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-ink-950/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{editing ? 'Edit subscription' : 'Add subscription'}</CardTitle>
                <button onClick={() => setOpen(false)} className="text-muted hover:text-app" aria-label="Close">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm text-muted">Tier</label>
                <select
                  className="mt-1.5 w-full h-10 rounded-md border border-app bg-elev px-3 text-sm capitalize"
                  value={draft.tier}
                  onChange={(e) => setDraft({ ...draft, tier: e.target.value as Tier })}
                >
                  <option value="standard">standard</option>
                  <option value="premium">premium</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-muted">Start date</label>
                  <Input
                    type="date"
                    className="mt-1.5"
                    value={draft.startDate}
                    onChange={(e) => setDraft({ ...draft, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm text-muted">End date</label>
                  <Input
                    type="date"
                    className="mt-1.5"
                    value={draft.endDate}
                    onChange={(e) => setDraft({ ...draft, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-muted">Note (optional)</label>
                <Input
                  className="mt-1.5"
                  value={draft.note}
                  onChange={(e) => setDraft({ ...draft, note: e.target.value })}
                  placeholder="Internal note about why"
                />
              </div>
              {err && <p className="text-sm text-red-600">{err}</p>}
              <div className="flex gap-2 pt-1">
                <Button onClick={save} disabled={busy}>{busy ? 'Saving…' : (editing ? 'Save' : 'Add')}</Button>
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Card>
  );
}
