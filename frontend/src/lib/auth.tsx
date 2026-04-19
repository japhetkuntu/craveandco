'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { post } from '@/lib/api';
import { API_PATHS, ROLE_DASHBOARD } from '@/lib/constants';

interface User {
  userId: string;
  role: string;
  branchId: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('crave_auth');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setToken(parsed.accessToken);
        // Decode JWT payload
        const payload = JSON.parse(atob(parsed.accessToken.split('.')[1]));
        setUser({ userId: payload.sub, role: payload.role, branchId: payload.branchId });
      } catch {
        localStorage.removeItem('crave_auth');
      }
    }

    const handleAuthUpdated = (event: Event) => {
      const detail = (event as CustomEvent)?.detail;
      if (detail && detail.accessToken) {
        setToken(detail.accessToken);
        const payload = JSON.parse(atob(detail.accessToken.split('.')[1]));
        setUser({ userId: payload.sub, role: payload.role, branchId: payload.branchId });
      } else {
        setToken(null);
        setUser(null);
      }
    };

    window.addEventListener('crave-auth-updated', handleAuthUpdated);
    setLoading(false);

    return () => {
      window.removeEventListener('crave-auth-updated', handleAuthUpdated);
    };
  }, []);

  const login = async (email: string, password: string) => {
    const res = await post(API_PATHS.auth.login, { email, password });
    localStorage.setItem('crave_auth', JSON.stringify(res));
    setToken(res.accessToken);
    const payload = JSON.parse(atob(res.accessToken.split('.')[1]));
    setUser({ userId: payload.sub, role: payload.role, branchId: payload.branchId });
  };

  const logout = () => {
    localStorage.removeItem('crave_auth');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function getRoleDashboard(role: string): string {
  return ROLE_DASHBOARD[role] || '/login';
}
