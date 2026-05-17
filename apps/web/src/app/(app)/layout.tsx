import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { backendData } from '@/lib/backend';
import type { User } from '@/lib/types';

// CRITICAL: never prerender or cache anything inside (app).
// Everything here depends on the session cookie. If Next.js / a CDN caches
// the auth-redirect output of an un-cookied request, every subsequent user
// gets sent to /login regardless of their real session. Forcing dynamic
// rendering + no-store on the responses prevents that class of bug.
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let user: User;
  try {
    user = await backendData<User>('/v1/auth/me');
  } catch {
    redirect('/login');
  }
  const pathname = (await headers()).get('x-pathname') ?? '';

  // 1. Pending creator (role flips to 'creator' on /apply but the
  //    is_creator_approved gate stays false until a moderator decides) —
  //    gate above EVERYTHING else. They stay on /under-review until then.
  if (user.role === 'creator' && !user.isCreatorApproved) {
    if (!pathname.startsWith('/under-review')) redirect('/under-review');
    return <AppShell user={user}>{children}</AppShell>;
  }

  // 2. Role-based home routing.
  if (user.role === 'superadmin') {
    if (pathname === '/' || pathname === '/dashboard' ||
        pathname.startsWith('/companion') || pathname.startsWith('/watch') ||
        pathname.startsWith('/reflect') || pathname.startsWith('/onboarding') ||
        pathname.startsWith('/moderate') || pathname.startsWith('/under-review')) {
      redirect('/admin/customers');
    }
  } else if (user.role === 'moderator') {
    if (pathname === '/' || pathname === '/dashboard' ||
        pathname.startsWith('/companion') || pathname.startsWith('/watch') ||
        pathname.startsWith('/reflect') || pathname.startsWith('/onboarding') ||
        pathname.startsWith('/admin') || pathname.startsWith('/under-review')) {
      redirect('/moderate/applications');
    }
  } else if (user.role === 'creator') {
    // Creators have a dedicated workspace. They are NOT customers — they
    // should not see /companion, /watch, /reflect, the daily ritual, or
    // any onboarding. They can only access /studio and /profile.
    const allowedForCreator =
      pathname === '/studio' || pathname.startsWith('/studio/') ||
      pathname === '/profile' || pathname.startsWith('/profile/');
    if (!allowedForCreator) redirect('/studio');
  } else {
    // customer (the default)
    if (pathname.startsWith('/admin') || pathname.startsWith('/moderate') ||
        pathname.startsWith('/under-review') ||
        pathname === '/studio' || pathname.startsWith('/studio/')) {
      redirect('/dashboard');
    }
    const onboarded = Boolean((user.preferences as Record<string, unknown>)?.onboarded);
    if (!onboarded && !pathname.startsWith('/onboarding')) {
      redirect('/onboarding');
    }
  }

  return <AppShell user={user}>{children}</AppShell>;
}
