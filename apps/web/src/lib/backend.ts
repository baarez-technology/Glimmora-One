import 'server-only';
import { getBearerToken } from './session';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8000';

export class BackendError extends Error {
  status: number;
  payload: unknown;
  constructor(status: number, payload: unknown) {
    const msg =
      (payload as any)?.detail ?? (payload as any)?.error ?? `Backend error ${status}`;
    super(typeof msg === 'string' ? msg : JSON.stringify(msg));
    this.status = status;
    this.payload = payload;
  }
}

type Init = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  authed?: boolean;
  query?: Record<string, string | number | boolean | undefined | null>;
  cache?: RequestCache;
};

export async function backend<T>(path: string, init: Init = {}): Promise<T> {
  const token = init.authed === false ? null : await getBearerToken();
  let url = `${BACKEND_URL}${path}`;
  if (init.query) {
    const usp = new URLSearchParams();
    for (const [k, v] of Object.entries(init.query)) {
      if (v !== undefined && v !== null) usp.set(k, String(v));
    }
    const q = usp.toString();
    if (q) url += (url.includes('?') ? '&' : '?') + q;
  }
  const res = await fetch(url, {
    method: init.method ?? 'GET',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    cache: init.cache ?? 'no-store',
  });
  if (res.status === 204 || res.status === 205 || res.status === 304) {
    return undefined as T;
  }
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok) throw new BackendError(res.status, json);
  return json as T;
}

/** Unwrap the standard `{success, data, error}` envelope. */
export async function backendData<T>(path: string, init: Init = {}): Promise<T> {
  const env = await backend<{ success: boolean; data: T; error?: string }>(path, init);
  if (!env?.success) throw new BackendError(500, env);
  return env.data;
}
