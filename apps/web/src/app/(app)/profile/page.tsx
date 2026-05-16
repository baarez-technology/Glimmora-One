import { backendData } from '@/lib/backend';
import type { User } from '@/lib/types';
import { ProfileEditor } from '@/components/profile-editor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function ProfilePage() {
  const user = await backendData<User>('/v1/auth/me');

  return (
    <div className="px-4 lg:px-8 py-8 max-w-3xl space-y-6">
      <header>
        <p className="text-sm uppercase tracking-[0.18em] text-glimmer-500">Profile</p>
        <h1 className="font-serif text-3xl md:text-4xl mt-1">{user.fullName || user.username}</h1>
        <p className="text-muted">{user.email}</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>You</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileEditor initial={user} />
        </CardContent>
      </Card>
    </div>
  );
}
