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
  const onboarded = Boolean((user.preferences as Record<string, unknown>)?.onboarded);
  if (!onboarded && !pathname.startsWith('/onboarding')) {
    redirect('/onboarding');
  }
  return <AppShell user={user}>{children}</AppShell>;
}
