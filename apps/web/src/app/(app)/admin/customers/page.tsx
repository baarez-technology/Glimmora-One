import { backendData } from '@/lib/backend';
import type { AdminUserRow } from '@/lib/types';
import { CustomersTable } from '@/components/admin/customers-table';
import { StatTile } from '@/components/ui/stat-tile';

export default async function AdminCustomersPage() {
  const initial = await backendData<AdminUserRow[]>('/v1/admin/customers');

  const totals = {
    all: initial.length,
    customers: initial.filter((u) => u.role === 'customer').length,
    creators: initial.filter((u) => u.role === 'creator').length,
    moderators: initial.filter((u) => u.role === 'moderator').length,
    premium: initial.filter((u) => u.subscriptionTier === 'premium').length,
    pendingApps: initial.filter((u) => u.hasPendingApplication).length,
  };

  return (
    <div className="px-4 lg:px-8 py-8 max-w-7xl space-y-8">
      <header>
        <p className="text-sm uppercase tracking-[0.18em] text-glimmer-500">Admin</p>
        <h1 className="font-serif text-3xl md:text-4xl mt-1">Customers</h1>
        <p className="text-muted mt-1">All users, filterable by role. Click a row to edit.</p>
      </header>

      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatTile label="Total users"   value={totals.all} />
        <StatTile label="Customers"     value={totals.customers} />
        <StatTile label="Creators"      value={totals.creators} />
        <StatTile label="Moderators"    value={totals.moderators} />
        <StatTile label="Premium"       value={totals.premium} accent />
        <StatTile label="Pending apps"  value={totals.pendingApps} sub={totals.pendingApps > 0 ? 'awaiting review' : 'all caught up'} />
      </section>

      <CustomersTable initial={initial} />
    </div>
  );
}
