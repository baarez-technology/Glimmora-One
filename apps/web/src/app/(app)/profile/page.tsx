import Link from 'next/link';
import { backendData } from '@/lib/backend';
import type { User } from '@/lib/types';
import { ProfileEditor } from '@/components/profile-editor';
import { ProfileSecurity } from '@/components/profile-security';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ROLE_BLURB: Record<string, string> = {
  member: 'You can read, watch, reflect, and talk with the companion.',
  creator: 'You can publish series and episodes through Studio.',
  admin: 'You can review creator applications and moderate the platform.',
  superadmin: 'You can do everything an admin can, plus manage other admins.',
};

type CreatorAppStatus = {
  id: string;
  status: 'pending' | 'approved' | 'denied';
  pitch: string;
} | null;

export default async function ProfilePage() {
  const user = await backendData<User>('/v1/auth/me');
  const entitlements = await backendData<{
    tier: string;
    details: { name: string; priceMonthly: number; features: string[] };
  }>('/v1/billing/me');
  let application: CreatorAppStatus = null;
  if (user.role === 'member') {
    try {
      application = await backendData<CreatorAppStatus>('/v1/creator/application/me');
    } catch {
      application = null;
    }
  }

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
          <CardTitle>Your role</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            You're currently a <strong className="capitalize">{user.role}</strong>.{' '}
            <span className="text-muted">{ROLE_BLURB[user.role] ?? ''}</span>
          </p>
          {user.role === 'member' && !application && (
            <p>
              Have something quiet to share?{' '}
              <Link href="/creator/apply" className="text-glimmer-500 hover:underline">
                Apply to become a creator →
              </Link>
            </p>
          )}
          {user.role === 'member' && application && application.status === 'pending' && (
            <p className="text-muted">
              Your creator application is being read. We'll be in touch.
            </p>
          )}
          {user.role === 'member' && application && application.status === 'denied' && (
            <p className="text-muted">
              We didn't approve your last application — you're welcome to{' '}
              <Link href="/creator/apply" className="text-glimmer-500 hover:underline">
                send another
              </Link>{' '}
              when you'd like.
            </p>
          )}
          {(user.role === 'creator' || user.role === 'admin' || user.role === 'superadmin') && (
            <p>
              <Link href="/creator" className="text-glimmer-500 hover:underline">
                Open Studio →
              </Link>
            </p>
          )}
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

      <Card>
        <CardHeader>
          <CardTitle>Security & data</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileSecurity user={user} />
        </CardContent>
      </Card>
    </div>
  );
}
