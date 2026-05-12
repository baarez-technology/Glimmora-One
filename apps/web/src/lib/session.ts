import 'server-only';
import { cookies } from 'next/headers';
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
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: maxAgeSeconds,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export const SESSION_COOKIE = COOKIE_NAME;
