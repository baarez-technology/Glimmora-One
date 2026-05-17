import 'server-only';
import { cookies, headers } from 'next/headers';
import { jwtVerify } from 'jose';

const COOKIE_NAME = 'glimmora_session';
const ENC = new TextEncoder();

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET is not configured');
  return ENC.encode(s);
}

export type SessionClaims = {
  sub: string;
  role?: string;
  exp?: number;
};

export async function getBearerToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(COOKIE_NAME)?.value ?? null;
}

export async function getSession(): Promise<SessionClaims | null> {
  const token = await getBearerToken();
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as SessionClaims;
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string, maxAgeSeconds: number) {
  // Detect the ORIGINAL scheme — DigitalOcean (and most PaaS) terminate TLS at
  // the edge and forward HTTP to the container, so process.env.NODE_ENV alone
  // can't tell us if the browser ↔ edge connection was HTTPS. The
  // x-forwarded-proto header (set by the proxy) is the source of truth.
  const h = await headers();
  const forwardedProto = (h.get('x-forwarded-proto') || '').split(',')[0].trim().toLowerCase();
  const isHttps = forwardedProto === 'https';

  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    // Only mark Secure if the request actually came in over HTTPS at the edge.
    // Otherwise the browser may reject the cookie (rare) or fail to send it
    // back on a same-domain follow-up that the proxy presents as HTTP.
    secure: isHttps,
    path: '/',
    maxAge: maxAgeSeconds,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export const SESSION_COOKIE = COOKIE_NAME;
