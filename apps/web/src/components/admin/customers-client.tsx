'use client';

import { useMemo, useState } from 'react';
import { RoleUsersTable } from './role-users-table';
import { StatTile } from '@/components/ui/stat-tile';
import type { AdminUserRow } from '@/lib/types';

type Filter = 'all' | 'premium' | 'standard' | 'pending';

export function CustomersClient({ initial }: { initial: AdminUserRow[] }) {
  const [filter, setFilter] = useState<Filter>('all');

  const totals = useMemo(() => ({
    all: initial.length,
    premium: initial.filter((u) => u.subscriptionTier === 'premium').length,
    standard: initial.filter((u) => u.subscriptionTier === 'standard').length,
    pending: initial.filter((u) => u.hasPendingApplication).length,
  }), [initial]);

  const toggle = (f: Filter) => setFilter((curr) => (curr === f ? 'all' : f));

  return (
    <>
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatTile label="Total customers" value={totals.all}
          active={filter === 'all'} onClick={() => setFilter('all')} />
        <StatTile label="Premium tier" value={totals.premium} accent
          active={filter === 'premium'} onClick={() => toggle('premium')} />
        <StatTile label="Standard tier" value={totals.standard}
          active={filter === 'standard'} onClick={() => toggle('standard')} />
        <StatTile label="Pending apps" value={totals.pending}
          sub={totals.pending > 0 ? 'awaiting review' : 'all caught up'}
          active={filter === 'pending'} onClick={() => toggle('pending')} />
      </section>

      <RoleUsersTable
        role="customer"
        initial={initial}
        emptyMessage="No customers match this filter."
        tier={filter === 'premium' ? 'premium' : filter === 'standard' ? 'standard' : undefined}
        pendingOnly={filter === 'pending'}
      />
    </>
  );
}
