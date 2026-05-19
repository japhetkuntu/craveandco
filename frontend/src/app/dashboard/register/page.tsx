'use client';

import { FormEvent, Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useCustomerAuth } from '@/lib/customer-auth';

function CustomerRegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { register } = useCustomerAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const next = params.get('next') || '/dashboard';

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await register({ name: name.trim(), email: email.trim(), password, phone: phone.trim() || undefined });
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
          <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-[#b86e2c]">Join Crave & Co.</p>
          <h1 className="mt-2 text-2xl font-bold text-[#26130f]">Create your account</h1>
          <p className="mt-2 text-sm text-[#5f4a38]">Save your details for faster checkout next time.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5f4a38]">Full name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-[#e3d1b6] bg-[#fdf8f2] px-4 py-3 text-sm outline-none focus:border-[#b5451b]"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5f4a38]">Email</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-[#e3d1b6] bg-[#fdf8f2] px-4 py-3 text-sm outline-none focus:border-[#b5451b]"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5f4a38]">Phone (optional)</label>
            <input
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-[#e3d1b6] bg-[#fdf8f2] px-4 py-3 text-sm outline-none focus:border-[#b5451b]"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5f4a38]">Password</label>
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
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
            Create account
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-[#5f4a38]">
          Already have an account?{' '}
          <Link
            href={`/dashboard/login${next ? `?next=${encodeURIComponent(next)}` : ''}`}
            className="font-semibold text-[#b5451b] hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function CustomerRegisterPage() {
  return (
    <Suspense>
      <CustomerRegisterForm />
    </Suspense>
  );
}
