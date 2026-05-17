'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const STORAGE_POS = 'glimmora-supportbot-pos';
const STORAGE_HIST = 'glimmora-supportbot-history';

type Msg = { role: 'user' | 'assistant'; content: string };

type Pos = { x: number; y: number };

const DEFAULT_POS: Pos = { x: 0, y: 0 };  // computed on mount

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

export function SupportBot() {
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<Pos>(DEFAULT_POS);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const dragRef = useRef<{ active: boolean; offsetX: number; offsetY: number }>({
    active: false, offsetX: 0, offsetY: 0,
  });
  const dragMovedRef = useRef(false);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // initial position — bottom-right, 24px from edge
  useEffect(() => {
    let initialPos: Pos;
    try {
      const stored = localStorage.getItem(STORAGE_POS);
      if (stored) {
        const parsed = JSON.parse(stored) as Pos;
        initialPos = {
          x: clamp(parsed.x, 0, window.innerWidth - 64),
          y: clamp(parsed.y, 0, window.innerHeight - 64),
        };
      } else {
        initialPos = { x: window.innerWidth - 24 - 56, y: window.innerHeight - 24 - 56 };
      }
    } catch {
      initialPos = { x: window.innerWidth - 80, y: window.innerHeight - 80 };
    }
    setPos(initialPos);
    setMounted(true);

    try {
      const h = localStorage.getItem(STORAGE_HIST);
      if (h) setMessages(JSON.parse(h));
    } catch { /* swallow */ }

    function onResize() {
      setPos((p) => ({
        x: clamp(p.x, 0, window.innerWidth - 64),
        y: clamp(p.y, 0, window.innerHeight - 64),
      }));
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // persist messages
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STORAGE_HIST, JSON.stringify(messages.slice(-30)));
    } catch { /* swallow */ }
  }, [messages, mounted]);

  // persist position
  useEffect(() => {
    if (!mounted) return;
    try { localStorage.setItem(STORAGE_POS, JSON.stringify(pos)); } catch { /* swallow */ }
  }, [pos, mounted]);

  useEffect(() => {
    if (open) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open, sending]);

  // ---- Drag handling ----
  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    // only RIGHT button initiates drag
    if (e.button !== 2) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = bubbleRef.current!.getBoundingClientRect();
    dragRef.current = { active: true, offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top };
    dragMovedRef.current = false;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current.active) return;
    const x = clamp(e.clientX - dragRef.current.offsetX, 0, window.innerWidth - 56);
    const y = clamp(e.clientY - dragRef.current.offsetY, 0, window.innerHeight - 56);
    dragMovedRef.current = true;
    setPos({ x, y });
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (dragRef.current.active) {
      dragRef.current.active = false;
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    }
  }

  function onClick() {
    // suppress click-open if the user just finished a drag
    if (dragMovedRef.current) {
      dragMovedRef.current = false;
      return;
    }
    setOpen((o) => !o);
  }

  // ---- Chat ----
  async function send(text: string) {
    const t = text.trim();
    if (!t || sending) return;
    setSending(true);
    setMessages((m) => [...m, { role: 'user', content: t }]);
    setInput('');
    try {
      const res = await fetch('/api/proxy/v1/support/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: t, history: messages.slice(-8) }),
      });
      const j = await res.json();
      const reply = j?.data?.reply ?? "I'm out of words for a moment — try again?";
      setMessages((m) => [...m, { role: 'assistant', content: reply }]);
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: "I couldn't reach the help service. Try again in a moment." }]);
    } finally {
      setSending(false);
    }
  }

  function clearChat() {
    setMessages([]);
    try { localStorage.removeItem(STORAGE_HIST); } catch { /* swallow */ }
  }

  if (!mounted) return null;

  // Panel size + smart edge — flip the panel to whichever side of the bubble has more room
  const PANEL_W = 360;
  const PANEL_H = 460;
  const panelOnRight = pos.x + 56 + PANEL_W + 16 > window.innerWidth;
  const panelOnTop   = pos.y + 56 + PANEL_H + 16 > window.innerHeight;
  const panelLeft = panelOnRight ? Math.max(8, pos.x - PANEL_W - 12) : pos.x + 56 + 12;
  const panelTop  = panelOnTop   ? Math.max(8, pos.y + 56 - PANEL_H) : pos.y;

  return (
    <>
      {/* Floating bubble */}
      <div
        ref={bubbleRef}
        role="button"
        tabIndex={0}
        aria-label="Open Glimmora help bot. Right-click and drag to move."
        title="Click to open. Right-click and drag to move."
        style={{ position: 'fixed', left: pos.x, top: pos.y, zIndex: 60, touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onContextMenu={(e) => e.preventDefault()}
        onClick={onClick}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(o => !o); } }}
        className={cn(
          'h-14 w-14 rounded-full grid place-items-center cursor-pointer select-none',
          'bg-glimmer-400 text-ink-950 shadow-[0_8px_30px_-6px_rgba(233,169,50,0.6),0_0_0_4px_rgba(233,169,50,0.18)]',
          'hover:shadow-[0_10px_40px_-6px_rgba(233,169,50,0.8),0_0_0_6px_rgba(233,169,50,0.22)]',
          'transition-shadow duration-300 ease-soft',
        )}
      >
        <MessageCircle className="h-6 w-6" />
      </div>

      {/* Chat panel */}
      {open && (
        <div
          style={{ position: 'fixed', left: panelLeft, top: panelTop, width: PANEL_W, height: PANEL_H, zIndex: 60 }}
          className="panel flex flex-col overflow-hidden animate-fade-up"
        >
          <header className="flex items-center justify-between px-4 py-3 border-b border-app/30">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-glimmer-400/20 grid place-items-center">
                <MessageCircle className="h-3.5 w-3.5 text-glimmer-500" />
              </div>
              <div>
                <p className="text-sm font-medium leading-tight">Glimmora Guide</p>
                <p className="text-[10px] uppercase tracking-widest text-muted">Help bot · ask anything</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button onClick={clearChat} className="text-[10px] uppercase tracking-widest text-muted hover:text-app px-2 py-1" title="Clear chat">
                  Clear
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-muted hover:text-app p-1" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scroll-quiet">
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-sm text-muted leading-relaxed">
                  Hey — I'm the in-app help bot. I can explain how Glimmora ONE works,
                  walk you through any flow, or tell you what your role can and can't do.
                  Try one of these:
                </p>
                <div className="flex flex-col gap-1.5">
                  {[
                    'What is Glimmora ONE?',
                    'How do I become a creator?',
                    "What's the difference between Standard and Premium?",
                    'Who can see my reflections?',
                  ].map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="text-left text-xs rounded-full border border-app/50 px-3 py-1.5 text-muted hover:text-app hover:bg-glimmer-400/10 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'rounded-2xl px-3 py-2 max-w-[85%] text-sm leading-relaxed whitespace-pre-wrap',
                    m.role === 'user'
                      ? 'bg-glimmer-400/20 text-app'
                      : 'bg-ink-100/60 dark:bg-ink-800/40 text-app',
                  )}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-ink-100/60 dark:bg-ink-800/40 px-3 py-2 inline-flex gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-glimmer-400 animate-breathe" />
                  <span className="h-1.5 w-1.5 rounded-full bg-glimmer-400 animate-breathe [animation-delay:200ms]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-glimmer-400 animate-breathe [animation-delay:400ms]" />
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="flex items-center gap-2 px-3 py-2 border-t border-app/30"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about anything in the app…"
              className="flex-1 h-9 rounded-md bg-app/40 border border-app/40 px-3 text-sm placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 ring-accent"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="h-9 w-9 rounded-md grid place-items-center bg-glimmer-400 text-ink-950 disabled:opacity-40 hover:bg-glimmer-300 transition-colors"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
