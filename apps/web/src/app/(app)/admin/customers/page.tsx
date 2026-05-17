import { backendData } from '@/lib/backend';
import type { AdminUserRow } from '@/lib/types';
import { CustomersTable } from '@/components/admin/customers-table';

export default async function AdminCustomersPage() {
  const initial = await backendData<AdminUserRow[]>('/v1/admin/customers');
  return (
    <div className="px-4 lg:px-8 py-8 max-w-6xl">
      <header className="mb-6">
        <p className="text-sm uppercase tracking-[0.18em] text-glimmer-500">Admin</p>
        <h1 className="font-serif text-3xl md:text-4xl mt-1">Customers</h1>
        <p className="text-muted mt-1">All users, filterable by role. Click a row to edit.</p>
      </header>
      <CustomersTable initial={initial} />
    </div>
  );
}
