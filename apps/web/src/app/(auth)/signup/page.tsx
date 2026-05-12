'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { signupAction } from '@/lib/auth-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Begin, gently.</CardTitle>
        <CardDescription>Two minutes. Nothing more than what you'd tell a friend.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          action={(fd) => {
            setError(null);
            startTransition(async () => {
              const res = await signupAction(fd);
              if (res?.error) setError(res.error);
            });
          }}
          className="space-y-4"
        >
          <div>
            <label className="text-sm text-muted" htmlFor="fullName">What should we call you?</label>
            <Input id="fullName" name="fullName" autoComplete="name" placeholder="First name (or anything you like)" className="mt-1.5" />
          </div>
          <div>
            <label className="text-sm text-muted" htmlFor="username">Username</label>
            <Input id="username" name="username" autoComplete="username" required minLength={1} className="mt-1.5" />
          </div>
          <div>
            <label className="text-sm text-muted" htmlFor="email">
              Email <span className="text-muted">(optional)</span>
            </label>
            <Input id="email" name="email" type="email" autoComplete="email" className="mt-1.5" />
          </div>
          <div>
            <label className="text-sm text-muted" htmlFor="password">Password</label>
            <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={1} className="mt-1.5" />
            <p className="mt-1 text-xs text-muted">You can change it later.</p>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button className="w-full" type="submit" disabled={isPending}>
            {isPending ? 'Creating…' : 'Create account'}
          </Button>
          <p className="text-center text-sm text-muted">
            Already with us?{' '}
            <Link href="/login" className="text-glimmer-500 hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
