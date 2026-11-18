// Base API client - all requests go to same origin (proxied by Vite in dev)
const BASE = '';

export interface ApiError {
  error: string;
  message?: string;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {})
    }
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'unknown' }));
    throw Object.assign(new Error(body.message ?? body.error ?? `HTTP ${res.status}`), { status: res.status, body });
  }
  return res.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body: unknown, csrf?: string): Promise<T> {
  return apiFetch<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: csrf ? { 'X-CSRF-Token': csrf } : {}
  });
}

export async function apiDelete<T>(path: string, csrf?: string): Promise<T> {
  return apiFetch<T>(path, {
    method: 'DELETE',
    headers: csrf ? { 'X-CSRF-Token': csrf } : {}
  });
}
