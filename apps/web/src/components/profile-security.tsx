'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { Input } from './ui/input';
import type { User } from '@/lib/types';

export function ProfileSecurity({ user }: { user: User }) {
  const router = useRouter();
  const [cp, setCp] = useState('');
  const [np, setNp] = useState('');
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwBusy, setPwBusy] = useState(false);

  const [confirm, setConfirm] = useState('');
  const [delBusy, setDelBusy] = useState(false);
  const [delErr, setDelErr] = useState<string | null>(null);

  async function changePassword() {
    setPwBusy(true);
    setPwMsg(null);
    try {
      const res = await fetch('/api/proxy/v1/users/me/password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ currentPassword: cp, newPassword: np }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json?.error ?? 'Could not change password');
      setPwMsg('Password updated.');
      setCp('');
      setNp('');
    } catch (e) {
      setPwMsg(e instanceof Error ? e.message : 'Could not change password');
    } finally {
      setPwBusy(false);
    }
  }

  async function exportData() {
    const res = await fetch('/api/proxy/v1/users/me/export');
    const json = await res.json();
    const data = json?.data ?? json;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `glimmora-${user.username}-export.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function deleteAccount() {
    setDelBusy(true);
    setDelErr(null);
    try {
      const res = await fetch('/api/proxy/v1/users/me', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ confirmUsername: confirm }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json?.error ?? 'Could not delete');
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
      router.refresh();
    } catch (e) {
      setDelErr(e instanceof Error ? e.message : 'Could not delete');
      setDelBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-serif text-lg">Change password</h3>
        <div className="grid sm:grid-cols-2 gap-2 mt-3">
          <Input type="password" placeholder="Current password" value={cp} onChange={(e) => setCp(e.target.value)} />
          <Input type="password" placeholder="New password" value={np} onChange={(e) => setNp(e.target.value)} />
        </div>
        <div className="mt-3 flex items-center gap-3">
          <Button size="sm" onClick={changePassword} disabled={pwBusy || !cp || !np}>
            {pwBusy ? 'Saving…' : 'Update password'}
          </Button>
          {pwMsg && <p className="text-sm text-muted">{pwMsg}</p>}
        </div>
      </div>

      <div>
        <h3 className="font-serif text-lg">Export your data</h3>
        <p className="text-sm text-muted mt-1">
          Download every reflection, conversation, and watch record as a single JSON file.
        </p>
        <Button size="sm" variant="ghost" onClick={exportData} className="mt-3">
          Download my data
        </Button>
      </div>

      {user.role !== 'superadmin' && (
        <div className="rounded-lg border border-red-300/40 p-4">
          <h3 className="font-serif text-lg text-red-700 dark:text-red-300">Delete account</h3>
          <p className="text-sm text-muted mt-1">
            This permanently removes your account, reflections, conversations, and posts. It cannot be undone.
            Type your username (<span className="font-mono">{user.username}</span>) to confirm.
          </p>
          <div className="flex gap-2 mt-3 flex-wrap">
            <Input
              placeholder={user.username}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="max-w-xs"
            />
            <Button
              size="sm"
              variant="ghost"
              disabled={delBusy || confirm !== user.username}
              onClick={deleteAccount}
              className="text-red-700 dark:text-red-300"
            >
              {delBusy ? 'Deleting…' : 'Permanently delete'}
            </Button>
          </div>
          {delErr && <p className="text-sm text-red-600 mt-2">{delErr}</p>}
        </div>
      )}
    </div>
  );
}
