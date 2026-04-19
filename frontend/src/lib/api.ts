import { API_BASE, API_PATHS } from '@/lib/constants';

interface FetchOptions extends RequestInit {
  token?: string;
}

function getStoredAuth(): { accessToken: string; refreshToken: string } | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('crave_auth');
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    localStorage.removeItem('crave_auth');
    return null;
  }
}

function setStoredAuth(auth: { accessToken: string; refreshToken: string }) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('crave_auth', JSON.stringify(auth));
  window.dispatchEvent(new CustomEvent('crave-auth-updated', { detail: auth }));
}

function clearStoredAuth() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('crave_auth');
  window.dispatchEvent(new CustomEvent('crave-auth-updated', { detail: null }));
}

async function refreshAccessToken() {
  const stored = getStoredAuth();
  if (!stored?.refreshToken) return null;

  const res = await fetch(`${API_BASE}${API_PATHS.auth.refresh}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: stored.refreshToken }),
  });

  if (!res.ok) {
    clearStoredAuth();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return null;
  }

  const tokens = await res.json();
  setStoredAuth(tokens);
  return tokens.accessToken;
}

export async function api<T = any>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { token, headers, ...rest } = options;
  const authToken = token || getStoredAuth()?.accessToken;
  const isAuthRoute = [API_PATHS.auth.login, API_PATHS.auth.refresh, API_PATHS.auth.logout].includes(path);

  const baseUrl = API_BASE || (typeof window !== 'undefined' ? window.location.origin : '');
  const requestUrl = path.startsWith('http') ? path : `${baseUrl}${path}`;
  const res = await fetch(requestUrl, {
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
      ...headers,
    },
    ...rest,
  });

  if (!res.ok) {
    if (res.status === 401 && !isAuthRoute) {
      const refreshedToken = await refreshAccessToken();
      if (refreshedToken) {
        return api(path, { token: refreshedToken, headers, ...rest });
      }
    }

    const body = await res.json().catch(() => ({}));
    const message = body.message || res.statusText || `API error ${res.status}`;
    throw new Error(`${path} - ${message}`);
  }

  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

export function get<T = any>(path: string, token?: string) {
  return api<T>(path, { method: 'GET', token });
}

export function post<T = any>(path: string, data: any, token?: string) {
  return api<T>(path, { method: 'POST', body: JSON.stringify(data), token });
}

export function patch<T = any>(path: string, data: any, token?: string) {
  return api<T>(path, { method: 'PATCH', body: JSON.stringify(data), token });
}

export function del<T = any>(path: string, token?: string) {
  return api<T>(path, { method: 'DELETE', token });
}
