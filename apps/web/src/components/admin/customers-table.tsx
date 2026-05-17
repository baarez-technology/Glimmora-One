'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import type { AdminUserRow, Role } from '@/lib/types';
import { TierBadge } from '@/components/app-shell';
import { formatRelative } from '@/lib/utils';

const ROLES: Role[] = ['customer', 'creator', 'moderator', 'superadmin'];

export function CustomersTable({ initial }: { initial: AdminUserRow[] }) {
  const [rows, setRows] = useState(initial);
  const [q, setQ] = useState('');
  const [role, setRole] = useState<string>('');

  useEffect(() => {
    const t = setTimeout(async () => {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (role) params.set('role', role);
      const res = await fetch(`/api/proxy/v1/admin/customers?${params.toString()}`);
      const json = await res.json();
      if (json?.success && Array.isArray(json.data)) setRows(json.data);
    }, 200);
    return () => clearTimeout(t);
  }, [q, role]);

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        <Input
          placeholder="Search by username, email, or full name…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="flex-1 min-w-[260px]"
        />
        <select
          className="h-10 rounded-md border border-app bg-elev px-3 text-sm"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="">All roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-app">
        <table className="w-full text-sm">
          <thead className="text-muted text-left">
            <tr className="border-b border-app bg-elev/40">
              <th className="py-2 px-3">Name</th>
              <th className="py-2 px-3">Username</th>
              <th className="py-2 px-3">Email</th>
              <th className="py-2 px-3">Role</th>
              <th className="py-2 px-3">Tier</th>
              <th className="py-2 px-3">Status</th>
              <th className="py-2 px-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="border-b border-app/40 last:border-0 hover:bg-glimmer-50 dark:hover:bg-glimmer-900/10">
                <td className="py-2 px-3">
                  <Link href={`/admin/customers/${u.id}`} className="hover:underline">
                    {u.fullName || u.username}
                  </Link>
                  {u.hasPendingApplication && (
                    <span className="ml-2 text-[9px] uppercase tracking-widest rounded-full bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200 px-1.5 py-0.5">
                      pending
                    </span>
                  )}
                </td>
                <td className="py-2 px-3 text-muted">{u.username}</td>
                <td className="py-2 px-3 text-muted">{u.email}</td>
                <td className="py-2 px-3 capitalize">{u.role}</td>
                <td className="py-2 px-3">
                  {(u.role === 'customer' || u.role === 'creator') ? <TierBadge tier={u.subscriptionTier} /> : '—'}
                </td>
                <td className="py-2 px-3">{u.isActive ? 'active' : 'disabled'}</td>
                <td className="py-2 px-3 text-muted">{formatRelative(u.createdAt)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={7} className="py-6 text-center text-muted">No users match.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
