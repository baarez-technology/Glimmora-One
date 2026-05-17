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

  // 1. Pending creator application → gate, regardless of role.
  if (user.hasPendingApplication && !pathname.startsWith('/under-review')) {
    redirect('/under-review');
  }

  // 2. Role-based home redirects
  if (user.role === 'superadmin') {
    if (pathname === '/' || pathname === '/dashboard') redirect('/admin/customers');
    if (pathname.startsWith('/companion') || pathname.startsWith('/watch') ||
        pathname.startsWith('/reflect') || pathname.startsWith('/onboarding')) {
      redirect('/admin/customers');
    }
  } else if (user.role === 'moderator') {
    if (pathname === '/' || pathname === '/dashboard') redirect('/moderate/applications');
    if (pathname.startsWith('/companion') || pathname.startsWith('/watch') ||
        pathname.startsWith('/reflect') || pathname.startsWith('/onboarding') ||
        pathname.startsWith('/admin')) {
      redirect('/moderate/applications');
    }
  } else {
    // customer / creator
    if (pathname.startsWith('/admin') || pathname.startsWith('/moderate')) {
      redirect('/dashboard');
    }
    // onboarding gate for everyone with normal product access
    const onboarded = Boolean((user.preferences as Record<string, unknown>)?.onboarded);
    if (!onboarded && !pathname.startsWith('/onboarding')) {
      redirect('/onboarding');
    }
  }

  return <AppShell user={user}>{children}</AppShell>;
}
