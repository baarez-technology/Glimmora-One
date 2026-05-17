import Link from 'next/link';
import { Compass, Sparkles, Film, PenLine, Upload, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { backendData } from '@/lib/backend';
import type { User } from '@/lib/types';

export default async function StudioPage() {
  const user = await backendData<User>('/v1/auth/me');
  const firstName = user.fullName?.split(' ')[0] || user.username;

  return (
    <div className="relative px-4 lg:px-8 py-8 max-w-4xl space-y-8">
      <div className="glow-orb lg" style={{ top: '-180px', right: '-160px' }} />

      <header className="relative">
        <p className="text-sm uppercase tracking-[0.18em] text-glimmer-500">Creator studio</p>
        <h1 className="font-serif text-4xl md:text-5xl mt-1">
          Welcome, {firstName}.
        </h1>
        <p className="text-muted mt-3 max-w-2xl leading-relaxed">
          Your application was approved — you're a Glimmora creator now. Your full publishing
          workspace is being built. For now, you can update your profile while we get the
          studio ready.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>What's coming next</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-3">
              <Film className="h-4 w-4 text-glimmer-500 mt-0.5 shrink-0" />
              <span><strong>Create series + episodes</strong> — upload your videos, set tiers (free / premium), order episodes, write the one quiet question that closes each one.</span>
            </li>
            <li className="flex gap-3">
              <PenLine className="h-4 w-4 text-glimmer-500 mt-0.5 shrink-0" />
              <span><strong>Long-form essays / blogs</strong> — for the things that don't need a camera. Same editorial care.</span>
            </li>
            <li className="flex gap-3">
              <Upload className="h-4 w-4 text-glimmer-500 mt-0.5 shrink-0" />
              <span><strong>Save drafts, publish when ready</strong> — nothing goes live without your explicit OK.</span>
            </li>
            <li className="flex gap-3">
              <Eye className="h-4 w-4 text-glimmer-500 mt-0.5 shrink-0" />
              <span><strong>Quiet analytics</strong> — see how many people finished what you made. No vanity metrics, no leaderboards.</span>
            </li>
          </ul>
          <p className="text-xs text-muted mt-6 italic">
            We're building this with the same calm care the rest of the app has. We'll email you the moment it opens.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your account</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted mb-4">
            Update your name, bio, or avatar any time. Anything you change there will show up
            on your creator profile once the studio launches.
          </p>
          <Button asChild>
            <Link href="/profile">
              <Compass className="h-4 w-4" /> Edit my profile
            </Link>
          </Button>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted pt-6">
        <Sparkles className="inline h-3 w-3 text-glimmer-500 mr-1" />
        Thank you for trusting us with your work. We're glad you're here.
      </p>
    </div>
  );
}
