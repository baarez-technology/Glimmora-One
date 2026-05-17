import { backendData } from '@/lib/backend';
import type { AdminUserRow } from '@/lib/types';
import { CreatorsClient } from '@/components/admin/creators-client';

export default async function AdminCreatorsPage() {
  const initial = await backendData<AdminUserRow[]>('/v1/admin/customers?role=creator');
  return (
    <div className="relative px-4 lg:px-8 py-8 max-w-7xl space-y-8">
      <div className="glow-orb lg" style={{ top: '-160px', right: '-160px' }} />

      <header className="relative">
        <p className="text-sm uppercase tracking-[0.18em] text-glimmer-500">Admin</p>
        <h1 className="font-serif text-4xl md:text-5xl mt-1">Creators</h1>
        <p className="text-muted mt-2 max-w-xl">
          Approved publishers. Tap a tile above to filter.
        </p>
      </header>

      <CreatorsClient initial={initial} />
    </div>
  );
}
