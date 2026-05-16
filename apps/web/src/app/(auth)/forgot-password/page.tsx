'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/proxy/v1/auth/password/forgot', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json?.error ?? 'Could not send');
      setSent(true);
      setDevToken(json.data?.devToken ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset your password</CardTitle>
        <CardDescription>Enter your email or username — we'll send a link to start fresh.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!sent && (
          <>
            <Input
              placeholder="email or username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button className="w-full" onClick={submit} disabled={busy || !email}>
              {busy ? 'Sending…' : 'Send reset link'}
            </Button>
          </>
        )}
        {sent && (
          <div className="space-y-3 text-sm">
            <p>
              If an account matches, we've sent a reset link. Open it within an hour to choose a new password.
            </p>
            {devToken && (
              <div className="rounded-md bg-glimmer-100/60 dark:bg-glimmer-900/30 border border-glimmer-300 p-3">
                <p className="text-xs uppercase tracking-widest text-glimmer-700 dark:text-glimmer-200">
                  Dev mode — SMTP not configured
                </p>
                <p className="mt-2 text-xs break-all font-mono">{devToken}</p>
                <Link
                  href={`/reset-password?token=${encodeURIComponent(devToken)}`}
                  className="mt-2 inline-block text-glimmer-600 dark:text-glimmer-200 hover:underline"
                >
                  Continue to reset →
                </Link>
              </div>
            )}
          </div>
        )}
        <p className="text-center text-sm">
          <Link href="/login" className="text-muted hover:text-app">Back to sign in</Link>
        </p>
      </CardContent>
    </Card>
  );
}
