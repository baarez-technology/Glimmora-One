import { backendData } from '@/lib/backend';
import type { AdminUserRow } from '@/lib/types';
import { ModeratorsPanel } from '@/components/admin/moderators-panel';

export default async function AdminModeratorsPage() {
  const initial = await backendData<AdminUserRow[]>('/v1/admin/moderators');
  return (
    <div className="px-4 lg:px-8 py-8 max-w-3xl">
      <header className="mb-6">
        <p className="text-sm uppercase tracking-[0.18em] text-glimmer-500">Admin</p>
        <h1 className="font-serif text-3xl md:text-4xl mt-1">Moderators</h1>
        <p className="text-muted mt-1">Trusted reviewers who decide creator applications.</p>
      </header>
      <ModeratorsPanel initial={initial} />
    </div>
  );
}
