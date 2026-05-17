import { NextResponse, type NextRequest } from 'next/server';
import { clearSessionCookie } from '@/lib/session';

export async function POST(req: NextRequest) {
  await clearSessionCookie();
  // Derive the redirect target from the INCOMING request so we always stay on
  // the same host (prod / preview / localhost). Hard-coding NEXT_PUBLIC_BASE_URL
  // or falling back to localhost breaks sign-out on every deployed environment.
  return NextResponse.redirect(new URL('/', req.url));
}
