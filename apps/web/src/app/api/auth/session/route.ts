import { NextResponse } from 'next/server';
import { setSessionCookie } from '@/lib/session';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as { token?: string; expiresIn?: number }));
  const token: string | undefined = body?.token;
  const expiresIn: number = Number(body?.expiresIn ?? 60 * 60 * 24);
  if (!token || typeof token !== 'string') {
    return NextResponse.json({ success: false, error: 'token required' }, { status: 400 });
  }
  await setSessionCookie(token, expiresIn);
  return NextResponse.json({ success: true });
}
