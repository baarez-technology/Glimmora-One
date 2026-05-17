import { backendData } from '@/lib/backend';
import type { AdminUserRow, CreatorApplication } from '@/lib/types';
import { ModeratorsPanel } from '@/components/admin/moderators-panel';
import { StatTile } from '@/components/ui/stat-tile';

export default async function AdminModeratorsPage() {
  const [initial, allApps] = await Promise.all([
    backendData<AdminUserRow[]>('/v1/admin/moderators'),
    backendData<CreatorApplication[]>('/v1/moderate/applications').catch(() => [] as CreatorApplication[]),
  ]);

  const pending  = allApps.filter((a) => a.status === 'pending').length;
  const approved = allApps.filter((a) => a.status === 'approved').length;
  const rejected = allApps.filter((a) => a.status === 'rejected').length;

  return (
    <div className="px-4 lg:px-8 py-8 max-w-5xl space-y-8">
      <header>
        <p className="text-sm uppercase tracking-[0.18em] text-glimmer-500">Admin</p>
        <h1 className="font-serif text-3xl md:text-4xl mt-1">Moderators</h1>
        <p className="text-muted mt-1">Trusted reviewers who decide creator applications.</p>
      </header>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile label="Active mods"   value={initial.length} accent />
        <StatTile label="Pending apps"  value={pending} sub={pending > 0 ? 'review queue' : 'queue empty'} />
        <StatTile label="Approved"      value={approved} />
        <StatTile label="Rejected"      value={rejected} />
      </section>

      <ModeratorsPanel initial={initial} />
    </div>
  );
}
