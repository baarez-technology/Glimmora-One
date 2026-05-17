import { NextResponse, type NextRequest } from 'next/server';
import { clearSessionCookie } from '@/lib/session';

export async function POST(req: NextRequest) {
  await clearSessionCookie();
  // Build the redirect from x-forwarded-host first, falling back to the host
  // header. `req.url` was unreliable on App Platform — behind the proxy it
  // sometimes resolved to the backend (localhost:8080) instead of the public
  // host, sending users to an unreachable URL after sign-out.
  const host =
    req.headers.get('x-forwarded-host') ||
    req.headers.get('host') ||
    'localhost:3000';
  const proto =
    req.headers.get('x-forwarded-proto') ||
    (host.startsWith('localhost') ? 'http' : 'https');
  return NextResponse.redirect(`${proto}://${host}/`, { status: 303 });
}
