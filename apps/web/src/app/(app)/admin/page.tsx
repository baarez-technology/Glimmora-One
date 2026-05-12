import { redirect } from 'next/navigation';
import { backendData } from '@/lib/backend';
import type { CreatorApplication, User } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ApplicationsTable } from '@/components/applications-table';

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

export default async function AdminPage() {
  const me = await backendData<User>('/v1/auth/me');
  if (me.role !== 'admin' && me.role !== 'superadmin') redirect('/dashboard');

  const [stats, users, applications] = await Promise.all([
    backendData<AdminStats>('/v1/admin/stats'),
    backendData<AdminUserRow[]>('/v1/admin/users'),
    backendData<CreatorApplication[]>('/v1/admin/applications').catch(() => []),
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
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-muted text-left">
              <tr className="border-b border-app">
                <th className="py-2 pr-3">User</th>
                <th className="py-2 pr-3">Email</th>
                <th className="py-2 pr-3">Role</th>
                <th className="py-2 pr-3">Tier</th>
                <th className="py-2 pr-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-app/40 last:border-0">
                  <td className="py-2 pr-3">{u.username}</td>
                  <td className="py-2 pr-3 text-muted">{u.email}</td>
                  <td className="py-2 pr-3">{u.role}</td>
                  <td className="py-2 pr-3">{u.subscriptionTier}</td>
                  <td className="py-2 pr-3">{u.isActive ? 'active' : 'disabled'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
