'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, getRoleDashboard } from '@/lib/auth';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      const stored = localStorage.getItem('crave_auth');
      if (stored) {
        const payload = JSON.parse(atob(JSON.parse(stored).accessToken.split('.')[1]));
        router.push(getRoleDashboard(payload.role));
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-base px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gold">Crave & Co</h1>
          <p className="text-text-secondary mt-2">Sign in to your portal</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-surface-raised rounded-2xl border border-border-default p-8 space-y-5"
        >
          {error && (
            <div className="bg-error-muted text-error text-sm p-3 rounded-xl flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-12 px-4 rounded-xl bg-surface-input border border-border-default text-text-primary placeholder:text-text-tertiary focus:border-gold focus:ring-1 focus:ring-gold focus:bg-surface-input-focus outline-none transition-all text-base"
              placeholder="you@craveandco.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full h-12 px-4 rounded-xl bg-surface-input border border-border-default text-text-primary placeholder:text-text-tertiary focus:border-gold focus:ring-1 focus:ring-gold focus:bg-surface-input-focus outline-none transition-all text-base"
              placeholder="••••••••"
            />
          </div>

          <Button type="submit" loading={loading} className="w-full" size="lg">
            Sign In
          </Button>
        </form>
      </div>
    </div>
  );
}
