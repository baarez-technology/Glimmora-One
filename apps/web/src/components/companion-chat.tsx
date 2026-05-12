'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { LifeBuoy, Send, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/input';
import { cn } from '@/lib/utils';
import type { ChatMessage, ChatResponse } from '@/lib/types';

const STARTERS = [
  'I notice I\'m a little restless today.',
  'There\'s something I\'ve been avoiding.',
  'I want to feel less rushed.',
  'I don\'t know what to do next.',
];

const EMOTION_COLORS: Record<string, string> = {
  sad: 'bg-blue-100 text-blue-900 dark:bg-blue-900/40 dark:text-blue-200',
  anxious: 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200',
  angry: 'bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-200',
  joyful: 'bg-glimmer-100 text-glimmer-700 dark:bg-glimmer-900/40 dark:text-glimmer-200',
  lonely: 'bg-violet-100 text-violet-900 dark:bg-violet-900/40 dark:text-violet-200',
  confused: 'bg-stone-100 text-stone-900 dark:bg-stone-800 dark:text-stone-200',
  hopeful: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200',
  neutral: 'bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-200',
};

type Props = {
  conversationId?: string;
  initialMessages?: ChatMessage[];
};

export function CompanionChat({ conversationId: initialId, initialMessages = [] }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [conversationId, setConversationId] = useState<string | undefined>(initialId);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [suggested, setSuggested] = useState<string | null>(null);
  const [crisis, setCrisis] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  async function send(text: string) {
    if (!text.trim() || sending) return;
    setSending(true);
    setSuggested(null);
    const optimistic: ChatMessage = {
      id: `tmp-${Date.now()}`,
      role: 'user',
      content: text,
      emotion: null,
      createdAt: new Date().toISOString(),
    };
    setMessages((m) => [...m, optimistic]);
    setInput('');
    try {
      const res = await fetch('/api/proxy/v1/ai/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: text, conversationId }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.error ?? 'companion is resting — try again in a moment');
      }
      const data = json.data as ChatResponse;
      setConversationId(data.conversationId);
      setMessages((m) => {
        const withoutTmp = m.filter((x) => x.id !== optimistic.id);
        return [...withoutTmp, data.userMessage, data.assistantMessage];
      });
      setSuggested(data.suggestedReflection);
      if (data.crisis) setCrisis(true);
    } catch (e) {
      const err = e instanceof Error ? e.message : 'something went sideways';
      setMessages((m) => [
        ...m,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: err,
          emotion: null,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  const empty = messages.length === 0;

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-quiet px-4 lg:px-12 py-8">
        {empty ? (
          <div className="max-w-xl mx-auto text-center pt-16 animate-fade-up">
            <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-glimmer-100 dark:bg-glimmer-900/40">
              <Sparkles className="h-5 w-5 text-glimmer-500" />
            </div>
            <h2 className="mt-5 font-serif text-3xl">I'm here.</h2>
            <p className="mt-2 text-muted">
              Start with one true sentence. We'll take it slow.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-sm rounded-full border border-app px-4 py-2 hover:bg-ink-100 dark:hover:bg-ink-800 transition"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-5">
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  'flex',
                  m.role === 'user' ? 'justify-end' : 'justify-start',
                )}
              >
                <div
                  className={cn(
                    'rounded-2xl px-4 py-3 max-w-[85%] whitespace-pre-wrap leading-relaxed shadow-soft animate-fade-up',
                    m.role === 'user'
                      ? 'bg-glimmer-100 text-ink-800 dark:bg-glimmer-900/40 dark:text-glimmer-100'
                      : 'bg-elev border border-app',
                  )}
                >
                  {m.content}
                  {m.emotion && (
                    <div className="mt-2">
                      <span
                        className={cn(
                          'inline-block text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full',
                          EMOTION_COLORS[m.emotion] ?? EMOTION_COLORS.neutral,
                        )}
                      >
                        {m.emotion}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-elev border border-app px-4 py-3 inline-flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-glimmer-400 animate-breathe" />
                  <span className="h-2 w-2 rounded-full bg-glimmer-400 animate-breathe [animation-delay:200ms]" />
                  <span className="h-2 w-2 rounded-full bg-glimmer-400 animate-breathe [animation-delay:400ms]" />
                </div>
              </div>
            )}
            {crisis && (
              <div className="rounded-lg border border-rose-300/70 bg-rose-50 dark:bg-rose-950/30 p-4 flex items-start gap-3 animate-fade-up">
                <LifeBuoy className="h-4 w-4 text-rose-600 mt-0.5 shrink-0" />
                <div className="flex-1 text-sm">
                  <p className="text-xs uppercase tracking-widest text-rose-700 dark:text-rose-300">
                    Stay with someone tonight
                  </p>
                  <p className="mt-1 leading-relaxed">
                    You're not alone in this exact moment. If you can, reach out to someone you trust — or a local crisis line.
                  </p>
                  <ul className="mt-2 space-y-1 text-muted">
                    <li><strong>India:</strong> iCall — 9152987821 · Vandrevala Foundation — 1860-2662-345</li>
                    <li><strong>US/Canada:</strong> 988 Suicide &amp; Crisis Lifeline — call or text 988</li>
                    <li><strong>UK/ROI:</strong> Samaritans — 116 123</li>
                    <li><strong>Global directory:</strong> <a className="text-glimmer-500 hover:underline" href="https://findahelpline.com" target="_blank" rel="noreferrer">findahelpline.com</a></li>
                  </ul>
                  <p className="mt-2 text-muted">I'm still here. You can keep writing.</p>
                </div>
              </div>
            )}

            {suggested && (
              <div className="rounded-lg border border-glimmer-300/60 bg-glimmer-50 dark:bg-glimmer-900/20 p-4 flex items-start gap-3 animate-fade-up">
                <Sparkles className="h-4 w-4 text-glimmer-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-widest text-glimmer-700 dark:text-glimmer-300">
                    A question to sit with
                  </p>
                  <p className="mt-1 font-serif text-lg">{suggested}</p>
                  <Link
                    href={`/reflect/new?prompt=${encodeURIComponent(suggested)}`}
                    className="mt-2 inline-block text-sm text-glimmer-500 hover:underline"
                  >
                    Write a reflection on this →
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-app/60 bg-app/80 backdrop-blur px-4 lg:px-12 py-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="max-w-2xl mx-auto flex items-end gap-2"
        >
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Say what's true right now…"
            rows={2}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
          />
          <Button type="submit" disabled={sending || !input.trim()} size="icon" aria-label="Send">
            <Send className="h-4 w-4" />
          </Button>
        </form>
        <p className="max-w-2xl mx-auto text-center text-xs text-muted mt-2">
          Glimmora is a companion, not a therapist. In a crisis, please reach out to someone you trust.
        </p>
      </div>
    </div>
  );
}
