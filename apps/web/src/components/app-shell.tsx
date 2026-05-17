'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Compass,
  Film,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { Brand } from './brand';
import { ThemeToggle } from './theme-toggle';
import { NotificationBell } from './notification-bell';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import type { Role, User } from '@/lib/types';

type Item = { href: string; icon: typeof LayoutDashboard; label: string };

const CUSTOMER_ITEMS: Item[] = [
  { href: '/dashboard',  icon: LayoutDashboard, label: 'Today' },
  { href: '/companion',  icon: MessageCircle,   label: 'Companion' },
  { href: '/watch',      icon: Film,            label: 'Stories' },
  { href: '/reflect',    icon: Sparkles,        label: 'Reflect' },
  { href: '/profile',    icon: Compass,         label: 'Profile' },
];

const MODERATOR_ITEMS: Item[] = [
  { href: '/moderate/applications', icon: ShieldCheck, label: 'Applications' },
  { href: '/profile',               icon: Compass,     label: 'Profile' },
];

const SUPERADMIN_ITEMS: Item[] = [
  { href: '/admin/customers',   icon: Users,       label: 'Customers' },
  { href: '/admin/creators',    icon: Sparkles,    label: 'Creators' },
  { href: '/admin/moderators',  icon: ShieldCheck, label: 'Moderators' },
  { href: '/profile',           icon: Compass,     label: 'Profile' },
];

function navFor(role: Role): Item[] {
  if (role === 'superadmin') return SUPERADMIN_ITEMS;
  if (role === 'moderator')  return MODERATOR_ITEMS;
  return CUSTOMER_ITEMS;
}

function roleLabel(role: Role): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function brandHrefFor(role: Role): string {
  if (role === 'moderator')  return '/moderate/applications';
  if (role === 'superadmin') return '/admin/customers';
  return '/dashboard';
}

export function AppShell({ user, children }: { user: User; children: React.ReactNode }) {
  const pathname = usePathname();
  const items = navFor(user.role);
  const isCustomerOrCreator = user.role === 'customer' || user.role === 'creator';
  const isFocusedPage = false;

  if (isFocusedPage) {
    // Full-bleed page, no sidebar, no utility cluster — the page owns the whole viewport.
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <div className="min-h-screen">
      {/* DESKTOP — floating sidebar rail, no chrome */}
      <aside className="hidden lg:flex fixed top-0 left-0 bottom-0 w-60 z-30 flex-col px-5 py-6 pointer-events-none">
        <div className="pointer-events-auto">
          <Brand href={brandHrefFor(user.role)} />
        </div>

        <nav className="pointer-events-auto mt-10 flex flex-col gap-1 text-sm">
          {items.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname?.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'group relative flex items-center gap-3 rounded-full px-3 py-2 transition-all duration-300 ease-soft',
                  active
                    ? 'bg-glimmer-400/15 text-app shadow-[inset_0_0_0_1px_rgba(233,169,50,0.30)]'
                    : 'text-muted hover:text-app hover:bg-app/5 hover:translate-x-0.5',
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'absolute -left-2 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r-full bg-glimmer-400 transition-all duration-300 ease-soft',
                    active ? 'opacity-100 scale-y-100 shadow-[0_0_12px_rgba(233,169,50,0.6)]' : 'opacity-0 scale-y-50',
                  )}
                />
                <Icon className={cn('h-4 w-4 transition-transform duration-200', active && 'scale-110 text-glimmer-500')} />
                <span>{label}</span>
              </Link>
            );
          })}

          {user.role === 'customer' && !user.hasPendingApplication && (
            <Link
              href="/apply"
              className="mt-4 flex items-center gap-3 rounded-full px-3 py-2 text-sm text-glimmer-600 dark:text-glimmer-300 hover:bg-glimmer-400/10 border border-dashed border-glimmer-400/40 transition-all"
            >
              <Sparkles className="h-4 w-4" /> Apply to be a creator
            </Link>
          )}
        </nav>

        <div className="pointer-events-auto mt-auto flex items-center gap-3 pt-6">
          <div className="h-9 w-9 rounded-full bg-glimmer-400/20 grid place-items-center text-sm font-medium shadow-[inset_0_0_0_1px_rgba(233,169,50,0.30)]">
            {(user.fullName || user.username).slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-sm font-medium">{user.fullName || user.username}</p>
              {isCustomerOrCreator && <TierBadge tier={user.subscriptionTier} />}
            </div>
            <p className="truncate text-xs text-muted">{roleLabel(user.role)}</p>
          </div>
        </div>
      </aside>

      {/* DESKTOP — floating utility cluster top-right, no chrome */}
      <div className="hidden lg:flex fixed top-4 right-4 z-30 items-center gap-1">
        <NotificationBell />
        <ThemeToggle />
        <form action="/api/auth/logout" method="post">
          <Button variant="ghost" size="sm" type="submit">
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </form>
      </div>

      {/* MOBILE — brand + utility bar across the top (still no card chrome, just spacing) */}
      <div className="lg:hidden sticky top-0 z-20 flex h-14 items-center justify-between px-4 backdrop-blur-md bg-app/30">
        <Brand href={brandHrefFor(user.role)} />
        <div className="flex items-center gap-1">
          <NotificationBell />
          <ThemeToggle />
          <form action="/api/auth/logout" method="post">
            <Button variant="ghost" size="sm" type="submit" aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* Main content — gets a left offset on desktop to clear the floating rail */}
      <main className="min-h-screen lg:pl-60 lg:pr-4 pb-24 lg:pb-0">
        {children}
      </main>

      {/* MOBILE — floating glass pill nav at the bottom */}
      <nav className="lg:hidden fixed bottom-3 left-3 right-3 z-30 flex items-center justify-around panel px-2 py-2">
        {items.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname?.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-1 text-[11px] rounded-full transition-colors',
                active ? 'text-glimmer-500' : 'text-muted',
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function TierBadge({ tier }: { tier: 'standard' | 'premium' }) {
  const isPremium = tier === 'premium';
  return (
    <span
      className={cn(
        'inline-block text-[9px] uppercase tracking-widest rounded-full px-1.5 py-0.5 font-medium',
        isPremium
          ? 'bg-glimmer-400 text-ink-950'
          : 'bg-ink-200 text-ink-700 dark:bg-ink-700 dark:text-ink-200',
      )}
    >
      {isPremium ? 'Premium' : 'Standard'}
    </span>
  );
}
