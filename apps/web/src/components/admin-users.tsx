'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from './ui/input';
import { Button } from './ui/button';

type Row = {
  id: string;
  username: string;
  email: string;
  role: string;
  subscriptionTier: string;
  isActive: boolean;
  createdAt: string;
};

const ROLES = ['member', 'creator', 'admin', 'superadmin'] as const;

export function AdminUsers({
  initial,
  canPromoteToSuperadmin,
}: {
  initial: Row[];
  canPromoteToSuperadmin: boolean;
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [, startTransition] = useTransition();

  useEffect(() => {
    const t = setTimeout(async () => {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (roleFilter) params.set('role', roleFilter);
      const res = await fetch(`/api/proxy/v1/admin/users?${params.toString()}`);
      const json = await res.json();
      if (json?.success && Array.isArray(json.data)) setRows(json.data);
    }, 200);
    return () => clearTimeout(t);
  }, [q, roleFilter]);

  async function setRole(id: string, role: string) {
    const res = await fetch(`/api/proxy/v1/admin/users/${id}/role?role=${role}`, { method: 'PATCH' });
    const json = await res.json();
    if (json?.success && json.data) {
      setRows((curr) => curr.map((r) => (r.id === id ? json.data : r)));
      startTransition(() => router.refresh());
    }
  }

  async function setActive(id: string, active: boolean) {
    const res = await fetch(`/api/proxy/v1/admin/users/${id}/active?active=${active}`, { method: 'PATCH' });
    const json = await res.json();
    if (json?.success && json.data) {
      setRows((curr) => curr.map((r) => (r.id === id ? json.data : r)));
      startTransition(() => router.refresh());
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        <Input
          placeholder="Search by username, email, or full name…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="flex-1 min-w-[220px]"
        />
        <select
          className="h-10 rounded-md border border-app bg-elev px-3 text-sm"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">All roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-muted text-left">
            <tr className="border-b border-app">
              <th className="py-2 pr-3">User</th>
              <th className="py-2 pr-3">Email</th>
              <th className="py-2 pr-3">Role</th>
              <th className="py-2 pr-3">Tier</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="border-b border-app/40 last:border-0">
                <td className="py-2 pr-3">{u.username}</td>
                <td className="py-2 pr-3 text-muted">{u.email}</td>
                <td className="py-2 pr-3">
                  <select
                    className="h-8 rounded-md border border-app bg-elev px-2 text-xs"
                    value={u.role}
                    onChange={(e) => setRole(u.id, e.target.value)}
                  >
                    {ROLES.filter((r) => r !== 'superadmin' || canPromoteToSuperadmin).map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </td>
                <td className="py-2 pr-3">{u.subscriptionTier}</td>
                <td className="py-2 pr-3">{u.isActive ? 'active' : 'disabled'}</td>
                <td className="py-2 pr-3">
                  <Button size="sm" variant="ghost" onClick={() => setActive(u.id, !u.isActive)}>
                    {u.isActive ? 'Disable' : 'Enable'}
                  </Button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="py-3 text-muted text-sm">No users match.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
