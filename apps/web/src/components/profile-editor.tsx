'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { Input, Textarea } from './ui/input';
import type { User } from '@/lib/types';

export function ProfileEditor({ initial }: { initial: User }) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initial.fullName ?? '');
  const [bio, setBio] = useState(initial.bio ?? '');
  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl ?? '');
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  async function save() {
    setSaving(true);
    try {
      await fetch('/api/proxy/v1/users/me', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ fullName, bio, avatarUrl }),
      });
      setSavedAt(Date.now());
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm text-muted">Name</label>
        <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1.5" />
      </div>
      <div>
        <label className="text-sm text-muted">Bio</label>
        <Textarea
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="One sentence is enough."
          className="mt-1.5"
        />
      </div>
      <div>
        <label className="text-sm text-muted">Avatar URL</label>
        <Input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} className="mt-1.5" placeholder="https://…" />
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
        {savedAt && <span className="text-xs text-muted">Saved.</span>}
      </div>
    </div>
  );
}
