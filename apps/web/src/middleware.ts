import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED = [
  '/dashboard', '/companion', '/watch', '/reflect',
  '/profile', '/admin', '/moderate', '/onboarding',
  '/under-review',
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
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next({ request: { headers: reqHeaders } });
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico|uploads).*)'],
};
