'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { loginAction } from '@/lib/auth-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>Step in gently — your space is waiting.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          action={(fd) => {
            setError(null);
            startTransition(async () => {
              const res = await loginAction(fd);
              if (res?.error) setError(res.error);
            });
          }}
          className="space-y-4"
        >
          <div>
            <label className="text-sm text-muted" htmlFor="username">Email or username</label>
            <Input id="username" name="username" autoComplete="username" required className="mt-1.5" />
          </div>
          <div>
            <label className="text-sm text-muted" htmlFor="password">Password</label>
            <Input id="password" name="password" type="password" autoComplete="current-password" required className="mt-1.5" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button className="w-full" type="submit" disabled={isPending}>
            {isPending ? 'Signing in…' : 'Sign in'}
          </Button>
          <div className="flex items-center justify-between text-sm">
            <Link href="/forgot-password" className="text-muted hover:text-app">Forgot password?</Link>
            <Link href="/signup" className="text-glimmer-500 hover:underline">Create an account</Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
