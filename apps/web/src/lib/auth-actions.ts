'use server';

import { redirect } from 'next/navigation';
import { backend, BackendError } from './backend';
import { clearSessionCookie, setSessionCookie } from './session';

type TokenEnv = { success: boolean; data: { accessToken: string; expiresIn: number } };

async function persistToken(payload: TokenEnv) {
  if (!payload.success || !payload.data?.accessToken) {
    throw new Error('Invalid auth response');
  }
  await setSessionCookie(payload.data.accessToken, payload.data.expiresIn);
}

export async function loginAction(formData: FormData): Promise<{ error?: string }> {
  const username = String(formData.get('username') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  if (!username || !password) return { error: 'Username and password required.' };
  try {
    const res = await backend<TokenEnv>('/v1/auth/login', {
      method: 'POST',
      body: { username, password },
      authed: false,
    });
    await persistToken(res);
  } catch (e) {
    if (e instanceof BackendError) return { error: e.message };
    return { error: 'Could not sign you in. Try again.' };
  }
  redirect('/dashboard');
}

export async function signupAction(formData: FormData): Promise<{ error?: string }> {
  const username = String(formData.get('username') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const fullName = String(formData.get('fullName') ?? '').trim() || null;
  if (!username || !password) return { error: 'Username and password are required.' };
  try {
    const res = await backend<TokenEnv>('/v1/auth/signup', {
      method: 'POST',
      body: { username, password, fullName, ...(email ? { email } : {}) },
      authed: false,
    });
    await persistToken(res);
  } catch (e) {
    if (e instanceof BackendError) return { error: e.message };
    return { error: 'Could not create your account. Try again.' };
  }
  redirect('/dashboard');
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect('/');
}
