'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { API_BASE } from '@/lib/constants';
import { friendlyError } from '@/lib/utils';

const STORAGE_KEY = 'crave_customer_auth';

interface CustomerProfile {
  customerId: string;
  email?: string;
  name: string;
}

interface CustomerTokens {
  accessToken: string;
  refreshToken: string;
}

interface CustomerAuthState {
  customer: CustomerProfile | null;
  token: string | null;
  loading: boolean;
  login: (emailOrPhone: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; phone?: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const CustomerAuthContext = createContext<CustomerAuthState | undefined>(undefined);

function decodePayload(token: string): CustomerProfile | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return { customerId: payload.sub, email: payload.email, name: payload.name };
  } catch {
    return null;
  }
}

function readStored(): CustomerTokens | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function writeStored(tokens: CustomerTokens | null) {
  if (typeof window === 'undefined') return;
  if (tokens) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

async function postPublic<T>(path: string, body: unknown): Promise<T> {
  const base = API_BASE || (typeof window !== 'undefined' ? window.location.origin : '');
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error(friendlyError(res.status, data?.message));
  }
  return data as T;
}

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = readStored();
    if (stored?.accessToken) {
      setToken(stored.accessToken);
      setCustomer(decodePayload(stored.accessToken));
    }
    setLoading(false);
  }, []);

  const applyTokens = useCallback((tokens: CustomerTokens) => {
    writeStored(tokens);
    setToken(tokens.accessToken);
    setCustomer(decodePayload(tokens.accessToken));
  }, []);

  const login = useCallback(async (emailOrPhone: string, password: string) => {
    const tokens = await postPublic<CustomerTokens>('/api/v1/public/customer/login', { emailOrPhone, password });
    applyTokens(tokens);
  }, [applyTokens]);

  const register = useCallback(async (data: { name: string; email: string; password: string; phone?: string }) => {
    const tokens = await postPublic<CustomerTokens>('/api/v1/public/customer/register', data);
    applyTokens(tokens);
  }, [applyTokens]);

  const logout = useCallback(async () => {
    const stored = readStored();
    if (stored?.refreshToken) {
      try {
        await postPublic('/api/v1/public/customer/logout', { refreshToken: stored.refreshToken });
      } catch {
        /* ignore network errors on logout */
      }
    }
    writeStored(null);
    setToken(null);
    setCustomer(null);
  }, []);

  const value = useMemo<CustomerAuthState>(
    () => ({ customer, token, loading, login, register, logout }),
    [customer, token, loading, login, register, logout],
  );

  return <CustomerAuthContext.Provider value={value}>{children}</CustomerAuthContext.Provider>;
}

export function useCustomerAuth() {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) throw new Error('useCustomerAuth must be used within CustomerAuthProvider');
  return ctx;
}

export async function customerFetch<T = unknown>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token: explicitToken, headers, ...rest } = options;
  const stored = readStored();
  const token = explicitToken ?? stored?.accessToken ?? null;
  const base = API_BASE || (typeof window !== 'undefined' ? window.location.origin : '');

  const res = await fetch(`${base}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (res.status === 401 && stored?.refreshToken && !explicitToken) {
    try {
      const refreshed = await postPublic<CustomerTokens>('/api/v1/public/customer/refresh', {
        refreshToken: stored.refreshToken,
      });
      writeStored(refreshed);
      window.dispatchEvent(new CustomEvent('crave-customer-auth-updated'));
      return customerFetch<T>(path, { ...options, token: refreshed.accessToken });
    } catch {
      writeStored(null);
      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard/login';
      }
    }
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error(friendlyError(res.status, data?.message));
  }
  return data as T;
}
