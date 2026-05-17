'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
        <CardTitle>Edit user — {initial.username}</CardTitle>
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
