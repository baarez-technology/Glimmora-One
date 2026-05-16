'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import type { Series } from '@/lib/types';

export function AdminSeriesModeration({ initial }: { initial: Series[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);

  async function togglePublish(s: Series, published: boolean) {
    setBusy(s.id);
    try {
      const res = await fetch(`/api/proxy/v1/admin/series/${s.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ published }),
      });
      const json = await res.json();
      if (json?.success && json.data) {
        setRows((curr) => curr.map((r) => (r.id === s.id ? json.data : r)));
        router.refresh();
      }
    } finally {
      setBusy(null);
    }
  }

  async function destroy(s: Series) {
    if (!confirm(`Permanently delete "${s.title}" and all its episodes?`)) return;
    setBusy(s.id);
    try {
      const res = await fetch(`/api/proxy/v1/admin/series/${s.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json?.success) {
        setRows((curr) => curr.filter((r) => r.id !== s.id));
        router.refresh();
      }
    } finally {
      setBusy(null);
    }
  }

  if (rows.length === 0) return <p className="text-muted text-sm">No series yet.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-muted text-left">
          <tr className="border-b border-app">
            <th className="py-2 pr-3">Series</th>
            <th className="py-2 pr-3">Category</th>
            <th className="py-2 pr-3">Tier</th>
            <th className="py-2 pr-3">Episodes</th>
            <th className="py-2 pr-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <tr key={s.id} className="border-b border-app/40 last:border-0">
              <td className="py-2 pr-3">
                <Link href={`/watch/${s.slug}`} className="hover:underline">{s.title}</Link>
              </td>
              <td className="py-2 pr-3 capitalize">{s.category.replace('-', ' ')}</td>
              <td className="py-2 pr-3 capitalize">{s.tier}</td>
              <td className="py-2 pr-3">{s.episodes.length}</td>
              <td className="py-2 pr-3 flex gap-1">
                <Button size="sm" variant="ghost" disabled={busy === s.id} onClick={() => togglePublish(s, false)}>
                  Unpublish
                </Button>
                <Button size="sm" variant="ghost" disabled={busy === s.id} onClick={() => togglePublish(s, true)}>
                  Publish
                </Button>
                <Button size="sm" variant="ghost" disabled={busy === s.id} onClick={() => destroy(s)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
