'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AdminUserRow, Role } from '@/lib/types';

const ASSIGNABLE_ROLES: Role[] = ['customer', 'creator', 'moderator'];

export function CustomerEditor({ initial }: { initial: AdminUserRow }) {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: initial.fullName ?? '',
    email: initial.email,
    role: initial.role,
    isActive: initial.isActive,
    bio: '',
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [delOpen, setDelOpen] = useState(false);
  const [delConfirm, setDelConfirm] = useState('');
  const [delBusy, setDelBusy] = useState(false);
  const [delErr, setDelErr] = useState<string | null>(null);

  const canDelete = initial.role !== 'superadmin';

  async function destroy() {
    setDelBusy(true);
    setDelErr(null);
    try {
      const res = await fetch(`/api/proxy/v1/admin/customers/${initial.id}`, { method: 'DELETE' });
      const j = await res.json();
      if (!res.ok || !j.success) throw new Error(j?.detail ?? j?.error ?? 'Could not delete');
      router.push('/admin/customers');
      router.refresh();
    } catch (e) {
      setDelErr(e instanceof Error ? e.message : 'Could not delete');
      setDelBusy(false);
    }
  }

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/proxy/v1/admin/customers/${initial.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      });
      const j = await res.json();
      if (!res.ok || !j.success) throw new Error(j?.detail ?? j?.error ?? 'Could not save');
      setMsg('Saved.');
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Could not save');
    } finally {
      setBusy(false);
    }
  }

  const editableRole = initial.role !== 'superadmin';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CardTitle>Edit user — {initial.username}</CardTitle>
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setDelOpen(true); setDelConfirm(''); setDelErr(null); }}
              className="text-red-600 hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4" /> Delete account
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Field label="Full name">
          <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        </Field>
        <Field label="Email">
          <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Role">
            {editableRole ? (
              <select
                className="w-full h-10 rounded-md border border-app bg-elev px-3 text-sm"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
              >
                {ASSIGNABLE_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            ) : (
              <Input value={form.role} disabled />
            )}
          </Field>
          <Field label="Status">
            <select
              className="w-full h-10 rounded-md border border-app bg-elev px-3 text-sm"
              value={form.isActive ? 'active' : 'disabled'}
              onChange={(e) => setForm({ ...form, isActive: e.target.value === 'active' })}
            >
              <option value="active">active</option>
              <option value="disabled">disabled</option>
            </select>
          </Field>
        </div>
        <Field label="Bio (admin note)">
          <Textarea rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        </Field>
        {msg && <p className="text-sm text-muted">{msg}</p>}
        <Button onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</Button>
      </CardContent>

      {delOpen && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-ink-950/60 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md border-red-500/40">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-red-600 dark:text-red-300">Delete this account</CardTitle>
                <button onClick={() => setDelOpen(false)} className="text-muted hover:text-app" aria-label="Close">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p>
                This will permanently delete <strong>{initial.username}</strong> and everything they own:
                reflections, conversations, watch progress, posts, subscriptions, applications, notifications.
                <strong className="block mt-2 text-red-700 dark:text-red-300">This cannot be undone.</strong>
              </p>
              <div>
                <label className="text-sm text-muted">
                  Type <span className="font-mono">{initial.username}</span> to confirm:
                </label>
                <Input
                  className="mt-1.5"
                  value={delConfirm}
                  onChange={(e) => setDelConfirm(e.target.value)}
                  placeholder={initial.username}
                  autoFocus
                />
              </div>
              {delErr && <p className="text-sm text-red-600">{delErr}</p>}
              <div className="flex gap-2 pt-1">
                <Button
                  onClick={destroy}
                  disabled={delBusy || delConfirm !== initial.username}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {delBusy ? 'Deleting…' : 'Permanently delete'}
                </Button>
                <Button variant="ghost" onClick={() => setDelOpen(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm text-muted">{label}</label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
