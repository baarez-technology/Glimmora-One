'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Compass,
  Film,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Sparkles,
} from 'lucide-react';
import { Brand } from './brand';
import { ThemeToggle } from './theme-toggle';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import type { User } from '@/lib/types';

const items = [
  { href: '/dashboard',  icon: LayoutDashboard, label: 'Today' },
  { href: '/companion',  icon: MessageCircle,   label: 'Companion' },
  { href: '/watch',      icon: Film,            label: 'Stories' },
  { href: '/reflect',    icon: Sparkles,        label: 'Reflect' },
  { href: '/profile',    icon: Compass,         label: 'Profile' },
];

export function AppShell({ user, children }: { user: User; children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen flex bg-app">
      <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-app/60 bg-elev/40 p-5">
        <Brand href="/dashboard" className="mb-8" />
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
        </nav>
        <div className="mt-auto flex items-center gap-3 pt-6">
          <div className="h-9 w-9 rounded-full bg-glimmer-200 dark:bg-ink-700 grid place-items-center text-sm">
            {(user.fullName || user.username).slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm">{user.fullName || user.username}</p>
            <p className="truncate text-xs text-muted capitalize">{user.role}</p>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-app/60 bg-app/80 px-4 lg:px-6 backdrop-blur">
          <div className="lg:hidden">
            <Brand href="/dashboard" />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <form action="/api/auth/logout" method="post">
              <Button variant="ghost" size="sm" type="submit">
                <LogOut className="h-4 w-4" /> Sign out
              </Button>
            </form>
          </div>
        </header>
        <main className="flex-1 min-w-0">{children}</main>

        <nav className="lg:hidden sticky bottom-0 z-20 flex items-center justify-around border-t border-app/60 bg-app/90 px-2 py-2 backdrop-blur">
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
