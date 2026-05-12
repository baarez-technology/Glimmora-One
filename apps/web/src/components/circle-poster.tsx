'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/input';

export function CirclePoster({ slug }: { slug: string }) {
  const router = useRouter();
  const [body, setBody] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function post() {
    if (!body.trim()) return;
    setPosting(true);
    setError(null);
    try {
      const res = await fetch(`/api/proxy/v1/community/circles/${slug}/posts`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ body }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json?.error ?? 'Could not post');
      setBody('');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not post');
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="rounded-lg border border-app bg-elev p-4">
      <Textarea
        rows={3}
        placeholder="Share quietly — you'll appear under a soft anonymous handle."
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      <div className="mt-3 flex justify-end">
        <Button onClick={post} disabled={posting || !body.trim()}>
          {posting ? 'Posting…' : 'Share'}
        </Button>
      </div>
    </div>
  );
}
