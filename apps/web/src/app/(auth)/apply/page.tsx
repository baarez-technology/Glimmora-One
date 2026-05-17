'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ApplyPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    pitch: '',
  });
  const [links, setLinks] = useState<string[]>(['']);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function updateList(arr: string[], setArr: (a: string[]) => void, i: number, v: string) {
    setArr(arr.map((x, idx) => (idx === i ? v : x)));
  }

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      // First create the account + application on the API
      const r = await fetch('/api/proxy/v1/creator-applications', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...form,
          links: links.map((s) => s.trim()).filter(Boolean),
          attachments: attachments.map((s) => s.trim()).filter(Boolean),
        }),
      });
      const j = await r.json();
      if (!r.ok || !j.success) throw new Error(j?.detail ?? j?.error ?? 'Could not submit');

      // Server returned a JWT — set it as the session cookie via the standard login endpoint? Easier:
      // call the login server action equivalent: just do a normal login since we know the credentials.
      const loginRes = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token: j.data.accessToken, expiresIn: j.data.expiresIn }),
      });
      if (!loginRes.ok) throw new Error('account created but session failed — try logging in');

      router.push('/under-review');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not submit');
    } finally {
      setBusy(false);
    }
  }

  const canSubmit =
    form.fullName.trim() &&
    form.username.trim() &&
    form.email.trim() &&
    form.password.trim() &&
    (form.pitch.trim().length > 0 || links.some((l) => l.trim()));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Apply to be a Glimmora creator</CardTitle>
        <CardDescription>
          Tell us what you'd like to share. A moderator will read every application by hand.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Field label="Your name">
          <Input value={form.fullName} onChange={(e) => set('fullName', e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Username (for sign in)">
            <Input value={form.username} onChange={(e) => set('username', e.target.value)} />
          </Field>
          <Field label="Email">
            <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
          </Field>
        </div>
        <Field label="Choose a password">
          <PasswordInput value={form.password} onChange={(e) => set('password', e.target.value)} />
        </Field>

        <Field label="What you'd like to share (a few sentences)">
          <Textarea rows={5} value={form.pitch} onChange={(e) => set('pitch', e.target.value)} placeholder="What kind of journeys, who they're for, why it matters to you." />
        </Field>

        <Field label="Links to previous work">
          {links.map((l, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <Input
                placeholder="https://…"
                value={l}
                onChange={(e) => updateList(links, setLinks, i, e.target.value)}
              />
              {links.length > 1 && (
                <Button variant="ghost" size="sm" onClick={() => setLinks(links.filter((_, idx) => idx !== i))}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button variant="ghost" size="sm" onClick={() => setLinks([...links, ''])}>
            <Plus className="h-4 w-4" /> Add link
          </Button>
        </Field>

        <Field label="Attachments (paste URLs to documents / videos / images)">
          {attachments.map((a, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <Input
                placeholder="https://…"
                value={a}
                onChange={(e) => updateList(attachments, setAttachments, i, e.target.value)}
              />
              <Button variant="ghost" size="sm" onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button variant="ghost" size="sm" onClick={() => setAttachments([...attachments, ''])}>
            <Plus className="h-4 w-4" /> Add attachment URL
          </Button>
        </Field>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button onClick={submit} disabled={busy || !canSubmit} className="w-full">
          {busy ? 'Submitting…' : 'Submit application'}
        </Button>

        <p className="text-center text-xs text-muted">
          By submitting, you create an account.{' '}
          <Link href="/login" className="hover:underline">Already have one? Sign in.</Link>
        </p>
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
