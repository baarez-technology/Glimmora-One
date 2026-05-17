import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED = [
  '/dashboard', '/companion', '/watch', '/reflect',
  '/profile', '/admin', '/moderate', '/onboarding',
  '/under-review', '/studio',
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // Forward pathname to server components via request headers.
  const reqHeaders = new Headers(req.headers);
  reqHeaders.set('x-pathname', pathname);

  if (!PROTECTED.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next({ request: { headers: reqHeaders } });
  }
  const hasSession = req.cookies.get('glimmora_session');
  if (!hasSession) {
    // Deliberately do NOT include a ?next= query param. It would leak the
    // previous role's intended destination (e.g. /admin/moderators) in the
    // address bar after sign-out. loginAction routes by role anyway, so
    // ?next= was dead code as well as a privacy leak.
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    return NextResponse.redirect(url);
  }
  return NextResponse.next({ request: { headers: reqHeaders } });
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico|uploads).*)'],
};
