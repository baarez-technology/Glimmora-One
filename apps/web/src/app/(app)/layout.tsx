import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { backendData } from '@/lib/backend';
import type { User } from '@/lib/types';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let user: User;
  try {
    user = await backendData<User>('/v1/auth/me');
  } catch {
    redirect('/login');
  }
  const pathname = (await headers()).get('x-pathname') ?? '';

  // 1. Pending creator application — gate above EVERYTHING else.
  //    Once gated, the user stays on /under-review until decision; no
  //    onboarding check, no role check, no other redirects.
  if (user.hasPendingApplication) {
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
  } else {
    // customer / creator
    if (pathname.startsWith('/admin') || pathname.startsWith('/moderate') ||
        pathname.startsWith('/under-review')) {
      redirect('/dashboard');
    }
    const onboarded = Boolean((user.preferences as Record<string, unknown>)?.onboarded);
    if (!onboarded && !pathname.startsWith('/onboarding')) {
      redirect('/onboarding');
    }
  }

  return <AppShell user={user}>{children}</AppShell>;
}
