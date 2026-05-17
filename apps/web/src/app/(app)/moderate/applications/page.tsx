import { backendData } from '@/lib/backend';
import type { CreatorApplication } from '@/lib/types';
import { ApplicationsReview } from '@/components/admin/applications-review';
import { StatTile } from '@/components/ui/stat-tile';

export default async function ModerateApplicationsPage() {
  const initial = await backendData<CreatorApplication[]>('/v1/moderate/applications');

  const pending  = initial.filter((a) => a.status === 'pending').length;
  const approved = initial.filter((a) => a.status === 'approved').length;
  const rejected = initial.filter((a) => a.status === 'rejected').length;
  const oldest   = initial.filter((a) => a.status === 'pending')
    .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt))[0];

  return (
    <div className="px-4 lg:px-8 py-8 max-w-6xl space-y-8">
      <header>
        <p className="text-sm uppercase tracking-[0.18em] text-glimmer-500">Moderator</p>
        <h1 className="font-serif text-3xl md:text-4xl mt-1">Creator applications</h1>
        <p className="text-muted mt-1">Read each application carefully before deciding.</p>
      </header>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile label="Pending"     value={pending} accent sub={oldest ? `oldest: ${new Date(oldest.createdAt).toLocaleDateString()}` : 'queue empty'} />
        <StatTile label="Approved"    value={approved} />
        <StatTile label="Rejected"    value={rejected} />
        <StatTile label="Total seen"  value={initial.length} />
      </section>

      <ApplicationsReview initial={initial} />
    </div>
  );
}
