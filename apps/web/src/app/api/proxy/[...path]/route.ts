import { NextRequest, NextResponse } from 'next/server';
import { getBearerToken } from '@/lib/session';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8000';

async function handle(req: NextRequest, segments: string[]) {
  const token = await getBearerToken();
  const url = `${BACKEND_URL}/${segments.join('/')}${req.nextUrl.search}`;

  const headers = new Headers();
  const contentType = req.headers.get('content-type');
  if (contentType) headers.set('content-type', contentType);
  if (token) headers.set('authorization', `Bearer ${token}`);

  const init: RequestInit = { method: req.method, headers };
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = await req.arrayBuffer();
  }

  const res = await fetch(url, init);

  // 204/205/304 must not have a body — NextResponse('', { status: 204 }) throws.
  if (res.status === 204 || res.status === 205 || res.status === 304) {
    return new NextResponse(null, { status: res.status });
  }

  const body = await res.arrayBuffer();
  const out = new NextResponse(body, { status: res.status });
  res.headers.forEach((v, k) => {
    if (!['content-encoding', 'transfer-encoding'].includes(k.toLowerCase())) {
      out.headers.set(k, v);
    }
  });
  return out;
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return handle(req, (await ctx.params).path);
}
export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return handle(req, (await ctx.params).path);
}
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return handle(req, (await ctx.params).path);
}
export async function PUT(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return handle(req, (await ctx.params).path);
}
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return handle(req, (await ctx.params).path);
}
