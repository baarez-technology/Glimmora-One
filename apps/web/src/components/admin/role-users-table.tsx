'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TierBadge } from '@/components/app-shell';
import { formatRelative } from '@/lib/utils';
import type { AdminUserRow, Role } from '@/lib/types';

type Props = {
  role: Role;
  initial: AdminUserRow[];
  emptyMessage?: string;
  /** Client-side filter — applied after server fetch / search. */
  tier?: 'standard' | 'premium';
  pendingOnly?: boolean;
  activeOnly?: boolean;
  disabledOnly?: boolean;
};

export function RoleUsersTable({ role, initial, emptyMessage, tier, pendingOnly, activeOnly, disabledOnly }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [q, setQ] = useState('');
  const [pending, setPending] = useState<AdminUserRow | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(async () => {
      const params = new URLSearchParams({ role });
      if (q) params.set('q', q);
      const res = await fetch(`/api/proxy/v1/admin/customers?${params.toString()}`);
      const json = await res.json();
      if (json?.success && Array.isArray(json.data)) setRows(json.data);
    }, 200);
    return () => clearTimeout(t);
  }, [q, role]);

  async function destroy() {
    if (!pending) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/proxy/v1/admin/customers/${pending.id}`, { method: 'DELETE' });
      const j = await res.json();
      if (!res.ok || !j.success) throw new Error(j?.detail ?? j?.error ?? 'Could not delete');
      setRows((curr) => curr.filter((r) => r.id !== pending.id));
      setPending(null);
      setConfirmText('');
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not delete');
    } finally {
      setBusy(false);
    }
  }

  const showTier = role === 'customer' || role === 'creator';

  const displayed = rows.filter((u) => {
    if (tier && u.subscriptionTier !== tier) return false;
    if (pendingOnly && !u.hasPendingApplication) return false;
    if (activeOnly && !u.isActive) return false;
    if (disabledOnly && u.isActive) return false;
    return true;
  });

  return (
    <>
      <div className="space-y-3">
        <Input
          placeholder="Search by username, email, or full name…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full"
        />

        <div className="panel overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-muted text-left">
              <tr className="border-b border-app">
                <th className="py-2 px-3">Name</th>
                <th className="py-2 px-3">Username</th>
                <th className="py-2 px-3">Email</th>
                {showTier && <th className="py-2 px-3">Tier</th>}
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Joined</th>
                <th className="py-2 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((u) => (
                <tr key={u.id} className="border-b border-app/40 last:border-0 hover:bg-glimmer-50 dark:hover:bg-glimmer-900/10">
                  <td className="py-2 px-3">
                    <Link href={`/admin/customers/${u.id}`} className="hover:underline">
                      {u.fullName || u.username}
                    </Link>
                    {u.hasPendingApplication && (
                      <span className="ml-2 text-[9px] uppercase tracking-widest rounded-full bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200 px-1.5 py-0.5">
                        pending
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-muted">{u.username}</td>
                  <td className="py-2 px-3 text-muted">{u.email}</td>
                  {showTier && (
                    <td className="py-2 px-3"><TierBadge tier={u.subscriptionTier} /></td>
                  )}
                  <td className="py-2 px-3">{u.isActive ? 'active' : 'disabled'}</td>
                  <td className="py-2 px-3 text-muted whitespace-nowrap">{formatRelative(u.createdAt)}</td>
                  <td className="py-2 px-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button asChild size="sm" variant="ghost" title="Edit">
                        <Link href={`/admin/customers/${u.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        title="Delete"
                        onClick={() => { setPending(u); setConfirmText(''); setErr(null); }}
                        className="text-red-600 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {displayed.length === 0 && (
                <tr><td colSpan={showTier ? 7 : 6} className="py-6 text-center text-muted">
                  {emptyMessage ?? 'No users yet.'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pending && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-ink-950/60 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md border-red-500/40">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-red-600 dark:text-red-300">Delete this account</CardTitle>
                <button onClick={() => setPending(null)} className="text-muted hover:text-app" aria-label="Close">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p>
                Permanently delete <strong>{pending.username}</strong> and everything they own:
                reflections, conversations, watch progress, posts, subscriptions, applications, notifications.
                <strong className="block mt-2 text-red-700 dark:text-red-300">This cannot be undone.</strong>
              </p>
              <div>
                <label className="text-sm text-muted">
                  Type <span className="font-mono">{pending.username}</span> to confirm:
                </label>
                <Input
                  className="mt-1.5"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={pending.username}
                  autoFocus
                />
              </div>
              {err && <p className="text-sm text-red-600">{err}</p>}
              <div className="flex gap-2 pt-1">
                <Button
                  onClick={destroy}
                  disabled={busy || confirmText !== pending.username}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {busy ? 'Deleting…' : 'Permanently delete'}
                </Button>
                <Button variant="ghost" onClick={() => setPending(null)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
