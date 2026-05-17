import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { backendData, BackendError } from '@/lib/backend';
import type { AdminUserRow, Subscription } from '@/lib/types';
import { CustomerEditor } from '@/components/admin/customer-editor';
import { SubscriptionManager } from '@/components/admin/subscription-manager';

export default async function CustomerEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let user: AdminUserRow;
  try {
    user = await backendData<AdminUserRow>(`/v1/admin/customers/${id}`);
  } catch (e) {
    if (e instanceof BackendError && e.status === 404) notFound();
    throw e;
  }
  const subs = await backendData<Subscription[]>(`/v1/admin/customers/${id}/subscriptions`).catch(
    () => [] as Subscription[],
  );

  return (
    <div className="px-4 lg:px-8 py-8 max-w-3xl space-y-6">
      <Link href="/admin/customers" className="inline-flex items-center text-sm text-muted hover:text-app">
        <ChevronLeft className="h-4 w-4" /> All customers
      </Link>
      <CustomerEditor initial={user} />
      <SubscriptionManager userId={user.id} initial={subs} />
    </div>
  );
}
