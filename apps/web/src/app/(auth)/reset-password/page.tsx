'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetForm />
    </Suspense>
  );
}

function ResetForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const [token, setToken] = useState(sp.get('token') ?? '');
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/proxy/v1/auth/password/reset', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token, newPassword: pw }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json?.error ?? 'Could not reset');
      setDone(true);
      setTimeout(() => router.push('/login'), 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not reset');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose a new password</CardTitle>
        <CardDescription>This link is valid for one hour.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!done && (
          <>
            <div>
              <label className="text-sm text-muted">Reset token</label>
              <Input className="mt-1.5 font-mono text-xs" value={token} onChange={(e) => setToken(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-muted">New password</label>
              <Input className="mt-1.5" type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button className="w-full" onClick={submit} disabled={busy || !token || !pw}>
              {busy ? 'Saving…' : 'Set new password'}
            </Button>
          </>
        )}
        {done && (
          <p className="text-sm">Password updated. Redirecting you to sign in…</p>
        )}
        <p className="text-center text-sm">
          <Link href="/login" className="text-muted hover:text-app">Back to sign in</Link>
        </p>
      </CardContent>
    </Card>
  );
}
