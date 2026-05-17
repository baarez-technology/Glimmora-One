'use client';

import { useMemo, useState } from 'react';
import { RoleUsersTable } from './role-users-table';
import { StatTile } from '@/components/ui/stat-tile';
import type { AdminUserRow } from '@/lib/types';

type Props = {
  initial: AdminUserRow[];
  pendingApps: number;
  approvedApps: number;
  rejectedApps: number;
};

type Filter = 'all' | 'active' | 'disabled';

export function ModeratorsClient({ initial, pendingApps, approvedApps, rejectedApps }: Props) {
  const [filter, setFilter] = useState<Filter>('all');

  const totals = useMemo(() => ({
    all: initial.length,
    active: initial.filter((u) => u.isActive).length,
    disabled: initial.filter((u) => !u.isActive).length,
  }), [initial]);

  const toggle = (f: Filter) => setFilter((curr) => (curr === f ? 'all' : f));

  return (
    <>
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatTile label="Active mods" value={totals.active} accent
          active={filter === 'active'} onClick={() => toggle('active')} />
        <StatTile label="Disabled" value={totals.disabled}
          active={filter === 'disabled'} onClick={() => toggle('disabled')} />
        <StatTile label="Pending apps" value={pendingApps}
          sub={pendingApps > 0 ? 'creator review queue' : 'queue empty'} />
        <StatTile label="Decided" value={approvedApps + rejectedApps}
          sub={`${approvedApps} approved · ${rejectedApps} rejected`} />
      </section>

      <RoleUsersTable
        role="moderator"
        initial={initial}
        emptyMessage="No moderators match this filter."
        activeOnly={filter === 'active'}
        disabledOnly={filter === 'disabled'}
      />
    </>
  );
}
