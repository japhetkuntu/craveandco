'use client';

import { FormEvent, Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useCustomerAuth } from '@/lib/customer-auth';

function CustomerLoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { login } = useCustomerAuth();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const next = params.get('next') || '/dashboard';

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(emailOrPhone.trim(), password);
      router.replace(next);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-[2rem] border border-[#ebdcc5] bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-[#b86e2c]">Welcome back</p>
          <h1 className="mt-2 text-2xl font-bold text-[#26130f]">Sign in to your account</h1>
          <p className="mt-2 text-sm text-[#5f4a38]">Track orders, save favourites, and reorder faster.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5f4a38]">Email or phone</label>
            <input
              type="text"
              required
              autoComplete="username"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-[#e3d1b6] bg-[#fdf8f2] px-4 py-3 text-sm outline-none focus:border-[#b5451b]"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5f4a38]">Password</label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-[#e3d1b6] bg-[#fdf8f2] px-4 py-3 text-sm outline-none focus:border-[#b5451b]"
            />
          </div>
          {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#26130f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#3a1f17] disabled:opacity-60"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
            Sign in
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-[#5f4a38]">
          New here?{' '}
          <Link
            href={`/dashboard/register${next ? `?next=${encodeURIComponent(next)}` : ''}`}
            className="font-semibold text-[#b5451b] hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function CustomerLoginPage() {
  return (
    <Suspense>
      <CustomerLoginForm />
    </Suspense>
  );
}

