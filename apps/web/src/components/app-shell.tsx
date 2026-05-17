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
  return CUSTOMER_ITEMS; // creator + customer share same loop UI
}

function roleLabel(role: Role): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export function AppShell({ user, children }: { user: User; children: React.ReactNode }) {
  const pathname = usePathname();
  const items = navFor(user.role);
  const isCustomerOrCreator = user.role === 'customer' || user.role === 'creator';
  return (
    <div className="min-h-screen flex">
      <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-app/40 bg-elev/30 backdrop-blur-xl p-5">
        <Brand href={user.role === 'moderator' ? '/moderate/applications' : (user.role === 'superadmin' ? '/admin/customers' : '/dashboard')} className="mb-8" />
        <nav className="flex flex-col gap-1 text-sm">
          {items.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname?.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'group relative flex items-center gap-3 rounded-md px-3 py-2 transition-all duration-200 ease-soft',
                  active
                    ? 'bg-glimmer-100/60 text-ink-800 dark:bg-glimmer-900/30 dark:text-glimmer-200'
                    : 'text-muted hover:text-app hover:bg-ink-100/60 dark:hover:bg-ink-800/40 hover:translate-x-0.5',
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r-full bg-glimmer-400 transition-all duration-300 ease-soft',
                    active ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-50',
                  )}
                />
                <Icon className={cn('h-4 w-4 transition-transform duration-200', active && 'scale-110')} />
                {label}
              </Link>
            );
          })}

          {/* Apply CTA — visible only to customers without a pending application */}
          {user.role === 'customer' && !user.hasPendingApplication && (
            <Link
              href="/apply"
              className="mt-3 flex items-center gap-3 rounded-md px-3 py-2 text-sm text-glimmer-600 dark:text-glimmer-300 hover:bg-glimmer-100/40 dark:hover:bg-glimmer-900/20 border border-dashed border-glimmer-300/60"
            >
              <Sparkles className="h-4 w-4" /> Apply to be a creator
            </Link>
          )}
        </nav>
        <div className="mt-auto flex items-center gap-3 pt-6">
          <div className="h-9 w-9 rounded-full bg-glimmer-200 dark:bg-ink-700 grid place-items-center text-sm">
            {(user.fullName || user.username).slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-sm">{user.fullName || user.username}</p>
              {isCustomerOrCreator && <TierBadge tier={user.subscriptionTier} />}
            </div>
            <p className="truncate text-xs text-muted">{roleLabel(user.role)}</p>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-app/40 bg-app/40 px-4 lg:px-6 backdrop-blur-xl">
          <div className="lg:hidden">
            <Brand href="/dashboard" />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <NotificationBell />
            <ThemeToggle />
            <form action="/api/auth/logout" method="post">
              <Button variant="ghost" size="sm" type="submit">
                <LogOut className="h-4 w-4" /> Sign out
              </Button>
            </form>
          </div>
        </header>
        <main className="flex-1 min-w-0">{children}</main>

        <nav className="lg:hidden sticky bottom-0 z-20 flex items-center justify-around border-t border-app/40 bg-app/40 px-2 py-2 backdrop-blur-xl">
          {items.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname?.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-1 text-[11px]',
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
