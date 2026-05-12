import Link from 'next/link';
import { Users } from 'lucide-react';
import { backendData } from '@/lib/backend';
import type { Circle } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function CirclesPage() {
  const circles = await backendData<Circle[]>('/v1/community/circles');
  return (
    <div className="px-4 lg:px-8 py-8 space-y-8 max-w-5xl">
      <header>
        <p className="text-sm uppercase tracking-[0.18em] text-glimmer-500">Circles</p>
        <h1 className="font-serif text-3xl md:text-4xl mt-1">Quiet places to speak.</h1>
        <p className="text-muted mt-2 max-w-xl">
          Anonymous, slow, moderated. You appear here only as a quiet handle of our choosing.
        </p>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {circles.map((c) => (
          <Link key={c.id} href={`/circles/${c.slug}`}>
            <Card className="hover:shadow-glow transition h-full">
              <CardHeader>
                <CardTitle>{c.name}</CardTitle>
                <CardDescription>{c.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 text-sm text-muted flex items-center gap-2">
                <Users className="h-4 w-4" />
                {c.postCount} reflections shared
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
