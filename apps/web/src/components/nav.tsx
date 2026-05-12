import Link from 'next/link';
import { Brand } from './brand';
import { ThemeToggle } from './theme-toggle';
import { Button } from './ui/button';

export function MarketingNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-app/60 bg-app/70 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Brand />
        <nav className="hidden md:flex items-center gap-7 text-sm text-muted">
          <Link href="/#stories" className="hover:text-app">Stories</Link>
          <Link href="/#companion" className="hover:text-app">Companion</Link>
          <Link href="/#journey" className="hover:text-app">Journey</Link>
          <Link href="/pricing" className="hover:text-app">Pricing</Link>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/signup">Begin</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
