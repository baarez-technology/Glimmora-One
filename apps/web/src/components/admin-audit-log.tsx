'use client';

import { formatRelative } from '@/lib/utils';

type Row = {
  id: string;
  actorId: string | null;
  action: string;
  target: string | null;
  meta: Record<string, unknown>;
  createdAt: string;
};

export function AdminAuditLog({ entries }: { entries: Row[] }) {
  if (entries.length === 0) {
    return <p className="text-muted text-sm">No audit events yet.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-muted text-left">
          <tr className="border-b border-app">
            <th className="py-2 pr-3">When</th>
            <th className="py-2 pr-3">Actor</th>
            <th className="py-2 pr-3">Action</th>
            <th className="py-2 pr-3">Target</th>
            <th className="py-2 pr-3">Details</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.id} className="border-b border-app/40 last:border-0 align-top">
              <td className="py-2 pr-3 text-muted whitespace-nowrap">{formatRelative(e.createdAt)}</td>
              <td className="py-2 pr-3 font-mono text-xs">{e.actorId ?? '—'}</td>
              <td className="py-2 pr-3">{e.action}</td>
              <td className="py-2 pr-3 font-mono text-xs">{e.target ?? '—'}</td>
              <td className="py-2 pr-3 text-xs text-muted max-w-md truncate">
                {Object.keys(e.meta || {}).length ? JSON.stringify(e.meta) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
