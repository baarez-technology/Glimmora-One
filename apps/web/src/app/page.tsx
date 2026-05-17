import Link from 'next/link';
import { ArrowRight, MessageCircle, PlayCircle, Sparkles } from 'lucide-react';
import { MarketingNav } from '@/components/nav';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/reveal';

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <MarketingNav />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 aurora animate-gradient-pan [background-size:200%_200%]" />
        <div className="container relative py-24 lg:py-32 max-w-5xl">
          <p className="text-sm uppercase tracking-[0.2em] text-glimmer-500 animate-fade-up">
            Glimmora ONE
          </p>
          <h1 className="mt-4 font-serif text-5xl md:text-7xl leading-[1.05] tracking-tight animate-fade-up">
            A calm room
            <br />
            <span className="italic text-ink-600 dark:text-ink-300">for your inner life.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted animate-fade-up">
            An AI companion that listens. A library of stories that quiet the noise. A journal
            that remembers what you're slowly learning. One soft, attentive space — yours.
          </p>
          <div className="mt-10 flex flex-wrap gap-3 animate-fade-up">
            <Button asChild size="lg">
              <Link href="/signup">Begin gently <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link href="#stories">See what's inside</Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="companion" className="container py-20 grid md:grid-cols-3 gap-6">
        {[
          {
            icon: MessageCircle,
            title: 'A companion who listens first',
            body: 'Trained to be present, not preachy. Glimmora notices what you carry and meets you where you are.',
          },
          {
            icon: PlayCircle,
            title: 'Stories that settle the mind',
            body: 'Short, beautifully made episodes on stillness, becoming, and feeling — followed by a single, kind question.',
          },
          {
            icon: Sparkles,
            title: 'A digital twin of your inner weather',
            body: 'Your reflections quietly become a map of what you feel, when — and what is slowly changing.',
          },
        ].map(({ icon: Icon, title, body }, i) => (
          <Reveal key={title} delay={i * 120}>
            <div className="lift rounded-lg border border-app bg-elev p-6 shadow-soft h-full">
              <Icon className="h-6 w-6 text-glimmer-500 group-hover:animate-pop" />
              <h3 className="mt-4 font-serif text-xl">{title}</h3>
              <p className="mt-2 text-sm text-muted">{body}</p>
            </div>
          </Reveal>
        ))}
      </section>

      <section id="stories" className="container py-20">
        <Reveal>
          <h2 className="font-serif text-3xl md:text-4xl tracking-tight max-w-2xl">
            Wisdom, made watchable.
          </h2>
          <p className="mt-3 text-muted max-w-2xl">
            A growing library of guided journeys — stillness, growth, emotional intelligence. Each
            episode ends with one quiet question.
          </p>
        </Reveal>
        <div className="mt-10 grid md:grid-cols-3 gap-5">
          {[
            { t: 'Still Mind', s: 'Twelve invitations to inner quiet.' },
            { t: 'Becoming without pressure', s: 'Growth that doesn\'t ask you to abandon yourself.' },
            { t: 'Feeling the shape of feeling', s: 'A field guide to your inner weather.' },
          ].map(({ t, s }, i) => (
            <Reveal key={t} delay={i * 140}>
              <div className="lift rounded-lg border border-app bg-elev p-6 h-full">
                <p className="text-xs uppercase tracking-widest text-glimmer-500">Series</p>
                <h3 className="mt-3 font-serif text-2xl">{t}</h3>
                <p className="mt-2 text-sm text-muted">{s}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="journey" className="container py-20 max-w-3xl">
        <Reveal>
          <blockquote className="font-serif text-2xl md:text-3xl leading-relaxed text-app">
            “The longest way is the safest way home — and the way home is mostly inward.”
          </blockquote>
          <p className="mt-4 text-sm text-muted">— a small reminder from us to you</p>
        </Reveal>
      </section>

      <footer className="border-t border-app/60 py-10">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted">
          <p>© {new Date().getFullYear()} Glimmora. Made with care.</p>
          <div className="flex items-center gap-5">
            <Link href="/apply" className="link-quiet hover:text-app">Apply as creator</Link>
            <Link href="/login" className="link-quiet hover:text-app">Sign in</Link>
            <Link href="/signup" className="link-quiet hover:text-app">Begin</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
