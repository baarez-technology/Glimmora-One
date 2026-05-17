'use server';

import { redirect } from 'next/navigation';
import { backend, BackendError } from './backend';
import { clearSessionCookie, setSessionCookie } from './session';
import type { User } from './types';

type TokenEnv = { success: boolean; data: { accessToken: string; expiresIn: number } };

export type AuthSuccess = { ok: true; token: string; expiresIn: number; dest: string };
export type AuthFailure = { ok: false; error: string };
export type AuthResult = AuthSuccess | AuthFailure;

async function landingPathForToken(token: string): Promise<string> {
  // Cookie isn't set yet (the client sets it after this returns) — use the
  // token as a Bearer directly against the backend.
  try {
    const url = `${process.env.BACKEND_URL ?? 'http://localhost:8000'}/v1/auth/me`;
    const r = await fetch(url, {
      headers: { authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!r.ok) return '/dashboard';
    const env = (await r.json()) as { data: User };
    const u = env.data;
    if (u.hasPendingApplication) return '/under-review';
    if (u.role === 'superadmin') return '/admin/customers';
    if (u.role === 'moderator')  return '/moderate/applications';
    const onboarded = Boolean((u.preferences as Record<string, unknown>)?.onboarded);
    return onboarded ? '/dashboard' : '/onboarding';
  } catch {
    return '/dashboard';
  }
}

export async function loginAction(formData: FormData): Promise<AuthResult> {
  const username = String(formData.get('username') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  if (!username || !password) return { ok: false, error: 'Username and password required.' };
  try {
    const res = await backend<TokenEnv>('/v1/auth/login', {
      method: 'POST',
      body: { username, password },
      authed: false,
    });
    if (!res.success || !res.data?.accessToken) {
      return { ok: false, error: 'Invalid response from server.' };
    }
    const dest = await landingPathForToken(res.data.accessToken);
    return { ok: true, token: res.data.accessToken, expiresIn: res.data.expiresIn, dest };
  } catch (e) {
    if (e instanceof BackendError) return { ok: false, error: e.message };
    return { ok: false, error: 'Could not sign you in. Try again.' };
  }
}

export async function signupAction(formData: FormData): Promise<AuthResult> {
  const username = String(formData.get('username') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const fullName = String(formData.get('fullName') ?? '').trim() || null;
  if (!username || !password) return { ok: false, error: 'Username and password are required.' };
  try {
    const res = await backend<TokenEnv>('/v1/auth/signup', {
      method: 'POST',
      body: { username, password, fullName, ...(email ? { email } : {}) },
      authed: false,
    });
    if (!res.success || !res.data?.accessToken) {
      return { ok: false, error: 'Invalid response from server.' };
    }
    // Brand-new signup → always start at onboarding.
    return { ok: true, token: res.data.accessToken, expiresIn: res.data.expiresIn, dest: '/onboarding' };
  } catch (e) {
    if (e instanceof BackendError) return { ok: false, error: e.message };
    return { ok: false, error: 'Could not create your account. Try again.' };
  }
}

// Used by /api/auth/logout. Server action that clears the cookie + redirects.
export async function logoutAction() {
  await clearSessionCookie();
  redirect('/');
}

// Keep setSessionCookie usable from server contexts (e.g. tests or scripts).
export { setSessionCookie };
