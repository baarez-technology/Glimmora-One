'use client';

import { useMemo, useState } from 'react';
import { RoleUsersTable } from './role-users-table';
import { StatTile } from '@/components/ui/stat-tile';
import type { AdminUserRow } from '@/lib/types';

type Filter = 'all' | 'premium' | 'active' | 'disabled';

export function CreatorsClient({ initial }: { initial: AdminUserRow[] }) {
  const [filter, setFilter] = useState<Filter>('all');

  const totals = useMemo(() => ({
    all: initial.length,
    premium: initial.filter((u) => u.subscriptionTier === 'premium').length,
    active: initial.filter((u) => u.isActive).length,
    disabled: initial.filter((u) => !u.isActive).length,
  }), [initial]);

  const toggle = (f: Filter) => setFilter((curr) => (curr === f ? 'all' : f));

  return (
    <>
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatTile label="Total creators" value={totals.all} accent
          active={filter === 'all'} onClick={() => setFilter('all')} />
        <StatTile label="Premium tier" value={totals.premium}
          active={filter === 'premium'} onClick={() => toggle('premium')} />
        <StatTile label="Active" value={totals.active}
          active={filter === 'active'} onClick={() => toggle('active')} />
        <StatTile label="Disabled" value={totals.disabled}
          active={filter === 'disabled'} onClick={() => toggle('disabled')} />
      </section>

      <RoleUsersTable
        role="creator"
        initial={initial}
        emptyMessage="No creators match this filter."
        tier={filter === 'premium' ? 'premium' : undefined}
        activeOnly={filter === 'active'}
        disabledOnly={filter === 'disabled'}
      />
    </>
  );
}
