import { backendData } from '@/lib/backend';
import type { AdminUserRow, CreatorApplication } from '@/lib/types';
import { ModeratorsCreate } from '@/components/admin/moderators-create';
import { ModeratorsClient } from '@/components/admin/moderators-client';

export default async function AdminModeratorsPage() {
  const [initial, allApps] = await Promise.all([
    backendData<AdminUserRow[]>('/v1/admin/customers?role=moderator'),
    backendData<CreatorApplication[]>('/v1/moderate/applications').catch(() => [] as CreatorApplication[]),
  ]);

  const pending  = allApps.filter((a) => a.status === 'pending').length;
  const approved = allApps.filter((a) => a.status === 'approved').length;
  const rejected = allApps.filter((a) => a.status === 'rejected').length;

  return (
    <div className="relative px-4 lg:px-8 py-8 max-w-7xl space-y-8">
      <div className="glow-orb" style={{ top: '-120px', right: '-100px' }} />
      <header className="relative flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-glimmer-500">Admin</p>
          <h1 className="font-serif text-4xl md:text-5xl mt-1">Moderators</h1>
          <p className="text-muted mt-2 max-w-xl">
            Trusted reviewers who decide creator applications. Tap a tile to filter.
          </p>
        </div>
        <ModeratorsCreate />
      </header>

      <ModeratorsClient
        initial={initial}
        pendingApps={pending}
        approvedApps={approved}
        rejectedApps={rejected}
      />
    </div>
  );
}
