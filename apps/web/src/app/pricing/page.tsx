import Link from 'next/link';
import { Check } from 'lucide-react';
import { MarketingNav } from '@/components/nav';
import { Button } from '@/components/ui/button';

const TIERS = [
  {
    id: 'free',
    name: 'Glimmora Free',
    price: '$0',
    blurb: 'Begin the practice. No pressure.',
    features: [
      'AI companion (short memory)',
      'All free series & episodes',
      'Personal reflection journal',
      'Three community circles',
    ],
    cta: 'Begin free',
    href: '/signup',
    accent: false,
  },
  {
    id: 'premium',
    name: 'Glimmora Premium',
    price: '$12',
    suffix: '/ month',
    blurb: 'Go further, gently.',
    features: [
      'Full AI companion with long memory',
      'All premium series & guided journeys',
      'Digital twin insights & trends',
      'Every community circle',
      'Priority creator tools',
    ],
    cta: 'Try premium',
    href: '/signup?plan=premium',
    accent: true,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      <MarketingNav />
      <section className="container py-20 max-w-4xl">
        <p className="text-sm uppercase tracking-[0.2em] text-glimmer-500">Membership</p>
        <h1 className="mt-3 font-serif text-4xl md:text-5xl tracking-tight">
          Two ways to begin.
        </h1>
        <p className="mt-4 text-muted max-w-2xl">
          The free tier is enough to start the practice. Premium is for those who want the full
          library, deeper memory in the companion, and a long view of their own becoming.
        </p>

        <div className="mt-14 grid md:grid-cols-2 gap-6">
          {TIERS.map((t) => (
            <div
              key={t.id}
              className={
                'rounded-lg border bg-elev p-8 shadow-soft transition ' +
                (t.accent
                  ? 'border-glimmer-300 shadow-glow'
                  : 'border-app')
              }
            >
              <p className="text-xs uppercase tracking-widest text-glimmer-500">{t.name}</p>
              <h3 className="mt-4 font-serif text-3xl">
                {t.price}
                <span className="text-base text-muted">{t.suffix ?? ''}</span>
              </h3>
              <p className="mt-2 text-sm text-muted">{t.blurb}</p>
              <ul className="mt-6 space-y-3 text-sm">
                {t.features.map((f) => (
                  <li key={f} className="flex gap-2 items-start">
                    <Check className="h-4 w-4 text-glimmer-500 mt-0.5" /> {f}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Button asChild variant={t.accent ? 'primary' : 'outline'} className="w-full">
                  <Link href={t.href}>{t.cta}</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
