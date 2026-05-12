import { backendData } from '@/lib/backend';
import type { User } from '@/lib/types';
import { ProfileEditor } from '@/components/profile-editor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function ProfilePage() {
  const user = await backendData<User>('/v1/auth/me');
  const entitlements = await backendData<{
    tier: string;
    details: { name: string; priceMonthly: number; features: string[] };
  }>('/v1/billing/me');

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

      <Card>
        <CardHeader>
          <CardTitle>Membership</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            Currently on <strong>{entitlements.details.name}</strong>{' '}
            {entitlements.details.priceMonthly > 0 && (
              <span className="text-muted">— ${entitlements.details.priceMonthly}/mo</span>
            )}
          </p>
          <ul className="list-disc pl-5 space-y-1 text-muted">
            {entitlements.details.features.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          <form action="/api/proxy/v1/billing/upgrade" method="post" className="pt-2">
            {entitlements.tier === 'free' ? (
              <button className="text-sm text-glimmer-500 hover:underline" type="submit">
                Try premium →
              </button>
            ) : (
              <p className="text-muted text-sm">You're on premium. Thank you for supporting Glimmora.</p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
