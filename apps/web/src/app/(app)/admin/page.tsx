import { redirect } from 'next/navigation';
import Link from 'next/link';
import { backendData } from '@/lib/backend';
import type { CreatorApplication, Series, User } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ApplicationsTable } from '@/components/applications-table';
import { AdminUsers } from '@/components/admin-users';
import { AdminAuditLog } from '@/components/admin-audit-log';
import { AdminSeriesModeration } from '@/components/admin-series-moderation';

type AdminStats = {
  users: number;
  series: number;
  episodes: number;
  reflections: number;
  conversations: number;
  posts: number;
};

type AdminUserRow = {
  id: string;
  username: string;
  email: string;
  role: string;
  subscriptionTier: string;
  isActive: boolean;
  createdAt: string;
};

type AuditRow = {
  id: string;
  actorId: string | null;
  action: string;
  target: string | null;
  meta: Record<string, unknown>;
  createdAt: string;
};

export default async function AdminPage() {
  const me = await backendData<User>('/v1/auth/me');
  if (me.role !== 'admin' && me.role !== 'superadmin') redirect('/dashboard');

  const [stats, users, applications, audit, allSeries] = await Promise.all([
    backendData<AdminStats>('/v1/admin/stats'),
    backendData<AdminUserRow[]>('/v1/admin/users'),
    backendData<CreatorApplication[]>('/v1/admin/applications').catch(() => []),
    backendData<AuditRow[]>('/v1/admin/audit-log').catch(() => []),
    backendData<Series[]>('/v1/admin/series').catch(() => []),
  ]);

  return (
    <div className="px-4 lg:px-8 py-8 space-y-10 max-w-6xl">
      <header>
        <p className="text-sm uppercase tracking-[0.18em] text-glimmer-500">Admin</p>
        <h1 className="font-serif text-3xl md:text-4xl mt-1">Platform</h1>
      </header>

      <section className="grid sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Object.entries(stats).map(([k, v]) => (
          <Card key={k}>
            <CardContent className="pt-5">
              <p className="text-xs uppercase tracking-widest text-muted">{k}</p>
              <p className="font-serif text-2xl mt-1">{v}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Creator applications</CardTitle>
        </CardHeader>
        <CardContent>
          <ApplicationsTable initial={applications} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminUsers initial={users} canPromoteToSuperadmin={me.role === 'superadmin'} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Content moderation</CardTitle>
            <Link href="/watch" className="text-sm text-glimmer-500 hover:underline">Public library →</Link>
          </div>
        </CardHeader>
        <CardContent>
          <AdminSeriesModeration initial={allSeries} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audit log</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminAuditLog entries={audit} />
        </CardContent>
      </Card>
    </div>
  );
}
