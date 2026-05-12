'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { CreatorApplication } from '@/lib/types';

export default function ApplyCreatorPage() {
  const router = useRouter();
  const [existing, setExisting] = useState<CreatorApplication | null | undefined>(undefined);
  const [pitch, setPitch] = useState('');
  const [sampleUrl, setSampleUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/proxy/v1/creator/application/me')
      .then((r) => r.json())
      .then((j) => setExisting(j?.data ?? null))
      .catch(() => setExisting(null));
  }, []);

  async function submit() {
    if (!pitch.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/proxy/v1/creator/apply', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ pitch, sampleUrl: sampleUrl || null }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json?.error ?? 'Could not submit');
      setExisting(json.data);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not submit');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="px-4 lg:px-8 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Apply to become a creator</CardTitle>
          <CardDescription>
            Tell us, in your own words, what you'd like to share and who you think it's for.
            We'll read every application by hand.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {existing === undefined && <p className="text-muted text-sm">Loading…</p>}

          {existing && (
            <div className="rounded-lg border border-app bg-elev p-4 text-sm space-y-2">
              <p className="text-xs uppercase tracking-widest text-glimmer-500">
                Your application — {existing.status}
              </p>
              <p className="italic">“{existing.pitch}”</p>
              {existing.status === 'pending' && (
                <p className="text-muted">We've received it. We'll be in touch.</p>
              )}
              {existing.status === 'approved' && (
                <p>You're a creator. Visit <a className="text-glimmer-500 hover:underline" href="/creator">your studio</a>.</p>
              )}
              {existing.status === 'denied' && (
                <p className="text-muted">Thank you for sharing. You're welcome to apply again later.</p>
              )}
            </div>
          )}

          {existing === null && (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted">Your pitch</label>
                <Textarea
                  rows={6}
                  className="mt-1.5"
                  placeholder="What kind of journey would you create? Who's it for? Why does it matter?"
                  value={pitch}
                  onChange={(e) => setPitch(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-muted">A sample, link, or portfolio (optional)</label>
                <Input
                  className="mt-1.5"
                  placeholder="https://…"
                  value={sampleUrl}
                  onChange={(e) => setSampleUrl(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button onClick={submit} disabled={submitting || !pitch.trim()}>
                {submitting ? 'Sending…' : 'Send application'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
