import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { backendData } from '@/lib/backend';
import type { CreatorApplication } from '@/lib/types';

export default async function UnderReviewPage() {
  const app = await backendData<CreatorApplication | null>('/v1/creator-applications/me').catch(
    () => null,
  );

  return (
    <div className="min-h-[80vh] grid place-items-center px-4 py-12">
      <Card className="max-w-xl w-full">
        <CardHeader>
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-glimmer-100 dark:bg-glimmer-900/40 mb-3">
            <Sparkles className="h-5 w-5 text-glimmer-500" />
          </div>
          <CardTitle className="text-center">Your application is under review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted">
            Thanks for applying to become a Glimmora creator. A moderator will read your application
            by hand and respond shortly. You'll get a notification here the moment we decide.
          </p>
          {app && (
            <div className="rounded-md border border-app bg-elev p-4 text-left text-sm space-y-2">
              <p><strong>Submitted:</strong> {new Date(app.createdAt).toLocaleString()}</p>
              {app.pitch && <p className="text-muted leading-relaxed">"{app.pitch}"</p>}
              {app.links?.length > 0 && (
                <ul className="text-xs text-muted">
                  {app.links.map((l) => (
                    <li key={l} className="truncate">{l}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <form action="/api/auth/logout" method="post">
            <Button variant="ghost" size="sm" type="submit">Sign out for now</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
