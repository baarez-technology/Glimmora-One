'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ModeratorsCreate() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ fullName: '', username: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function create() {
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch('/api/proxy/v1/admin/moderators', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      });
      const j = await r.json();
      if (!r.ok || !j.success) throw new Error(j?.detail ?? j?.error ?? 'Could not create');
      setOpen(false);
      setForm({ fullName: '', username: '', email: '', password: '' });
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not create');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Create moderator
      </Button>

      {open && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-ink-950/60 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Create moderator</CardTitle>
                <button onClick={() => setOpen(false)} className="text-muted hover:text-app" aria-label="Close">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm text-muted">Full name</label>
                <Input className="mt-1.5" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-muted">Username</label>
                  <Input className="mt-1.5" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm text-muted">Email</label>
                  <Input type="email" className="mt-1.5" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-sm text-muted">Initial password</label>
                <PasswordInput className="mt-1.5" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                <p className="text-xs text-muted mt-1">Share with them out-of-band; they can change it later.</p>
              </div>
              {err && <p className="text-sm text-red-600">{err}</p>}
              <div className="flex gap-2 pt-1">
                <Button onClick={create} disabled={busy || !form.username || !form.email || !form.password || !form.fullName}>
                  {busy ? 'Creating…' : 'Create'}
                </Button>
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
