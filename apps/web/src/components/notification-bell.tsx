'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { cn, formatRelative } from '@/lib/utils';
import type { Notification } from '@/lib/types';

export function NotificationBell() {
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const popRef = useRef<HTMLDivElement>(null);

  async function fetchUnread() {
    try {
      const r = await fetch('/api/proxy/v1/notifications/unread-count', { cache: 'no-store' });
      const j = await r.json();
      if (j?.success) setUnread(j.data?.unread ?? 0);
    } catch { /* swallow */ }
  }

  async function fetchList() {
    try {
      const r = await fetch('/api/proxy/v1/notifications', { cache: 'no-store' });
      const j = await r.json();
      if (j?.success && Array.isArray(j.data)) setItems(j.data);
    } catch { /* swallow */ }
  }

  useEffect(() => {
    fetchUnread();
    const id = setInterval(fetchUnread, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (open) fetchList();
  }, [open]);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (popRef.current && !popRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  async function markAll() {
    await fetch('/api/proxy/v1/notifications/read-all', { method: 'POST' });
    setItems((curr) => curr.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
    setUnread(0);
  }

  async function markOne(id: string) {
    await fetch(`/api/proxy/v1/notifications/${id}/read`, { method: 'POST' });
    setItems((curr) => curr.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)));
    setUnread((u) => Math.max(0, u - 1));
  }

  return (
    <div className="relative" ref={popRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className="relative inline-flex items-center justify-center h-9 w-9 rounded-full hover:bg-ink-100/60 dark:hover:bg-ink-800/40 transition"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 grid place-items-center rounded-full bg-glimmer-400 text-ink-950 text-[10px] font-medium">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-[70vh] overflow-y-auto rounded-lg border border-app bg-app shadow-soft z-30">
          <div className="flex items-center justify-between px-3 py-2 border-b border-app/60">
            <p className="text-xs uppercase tracking-widest text-muted">Notifications</p>
            <button onClick={markAll} className="text-xs text-glimmer-600 dark:text-glimmer-300 hover:underline">
              Mark all read
            </button>
          </div>
          {items.length === 0 && (
            <p className="px-3 py-6 text-sm text-muted text-center">No notifications yet.</p>
          )}
          {items.map((n) => (
            <div
              key={n.id}
              className={cn(
                'px-3 py-3 border-b border-app/40 last:border-0 text-sm',
                !n.readAt && 'bg-glimmer-50 dark:bg-glimmer-900/10',
              )}
            >
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  {n.link ? (
                    <Link
                      href={n.link}
                      onClick={() => { setOpen(false); if (!n.readAt) markOne(n.id); }}
                      className="font-medium hover:underline"
                    >
                      {n.title}
                    </Link>
                  ) : (
                    <p className="font-medium">{n.title}</p>
                  )}
                  {n.body && <p className="text-xs text-muted mt-0.5 leading-snug">{n.body}</p>}
                  <p className="text-[10px] text-muted mt-1 uppercase tracking-widest">
                    {formatRelative(n.createdAt)}
                  </p>
                </div>
                {!n.readAt && (
                  <button onClick={() => markOne(n.id)} className="text-muted hover:text-app" aria-label="Mark read">
                    <Check className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
