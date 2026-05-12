import Link from 'next/link';
import { Brand } from '@/components/brand';

export default function NotFound() {
  return (
    <div className="min-h-screen grid place-items-center px-6 text-center">
      <div>
        <Brand className="mx-auto" />
        <h1 className="mt-8 font-serif text-4xl">Not here.</h1>
        <p className="mt-2 text-muted">The page you wanted has wandered off. That's okay.</p>
        <Link href="/" className="mt-6 inline-block text-glimmer-500 hover:underline">
          Take me home →
        </Link>
      </div>
    </div>
  );
}
