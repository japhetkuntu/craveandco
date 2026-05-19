'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShoppingBag, User, LogOut, ArrowLeft, Home } from 'lucide-react';
import { ReactNode } from 'react';
import { CustomerAuthProvider, useCustomerAuth } from '@/lib/customer-auth';
import { CustomerCartProvider, useCustomerCart } from '@/lib/customer-cart';
import { ECOMMERCE_ENABLED, CUSTOMER_ACCOUNT_ENABLED } from '@/lib/feature-flags';

function CustomerNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { customer, logout, loading } = useCustomerAuth();
  const { count } = useCustomerCart();

  return (
    <header className="sticky top-0 z-40 border-b border-[#e6d8c4] bg-[#fdf8f2]/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          {pathname !== '/dashboard' && (
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Go back"
              className="-ml-2 rounded-full p-2 text-[#5f4a38] transition hover:bg-[#f3e5d6] hover:text-[#26130f]"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <Link href="/dashboard" className="flex flex-col leading-tight">
            <span className="text-[10px] font-semibold uppercase tracking-[0.4em] text-[#b86e2c]">Crave & Co.</span>
            <span className="text-base font-bold text-[#26130f]">Order</span>
          </Link>
        </div>
        <nav className="flex items-center gap-1 sm:gap-2">
          {CUSTOMER_ACCOUNT_ENABLED && (
            <Link
              href="/dashboard/orders"
              className="hidden rounded-full px-4 py-2 text-sm font-medium text-[#5f4a38] transition hover:bg-[#f3e5d6] hover:text-[#26130f] sm:inline-flex"
            >
              My Orders
            </Link>
          )}
          {ECOMMERCE_ENABLED && (
            <Link
              href="/dashboard/checkout"
              aria-label="Open cart"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#26130f] text-white transition hover:bg-[#3a1f17] sm:h-auto sm:w-auto sm:px-4 sm:py-2 sm:gap-2"
            >
              <ShoppingBag size={18} />
              <span className="hidden sm:inline text-sm font-semibold">Cart</span>
              {count > 0 && (
                <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#b5451b] px-1 text-[10px] font-bold text-white sm:static sm:ml-1 sm:h-5 sm:w-5">
                  {count}
                </span>
              )}
            </Link>
          )}
          {CUSTOMER_ACCOUNT_ENABLED && !loading && customer ? (
            <button
              type="button"
              onClick={() => logout().then(() => router.push('/dashboard'))}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#5f4a38] transition hover:bg-[#f3e5d6] hover:text-[#26130f]"
              aria-label="Sign out"
            >
              <LogOut size={18} />
            </button>
          ) : CUSTOMER_ACCOUNT_ENABLED ? (
            <Link
              href="/dashboard/login"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#5f4a38] transition hover:bg-[#f3e5d6] hover:text-[#26130f] sm:h-auto sm:w-auto sm:px-4 sm:py-2"
              aria-label="Sign in"
            >
              <User size={18} />
              <span className="hidden sm:ml-2 sm:inline text-sm font-semibold">Sign in</span>
            </Link>
          ) : null}
          <Link
            href="/"
            aria-label="Back to home"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#5f4a38] transition hover:bg-[#f3e5d6] hover:text-[#26130f]"
          >
            <Home size={18} />
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default function CustomerLayout({ children }: { children: ReactNode }) {
  return (
    <CustomerAuthProvider>
      <CustomerCartProvider>
        <div className="min-h-screen bg-[#fdf8f2] text-[#26130f]">
          <CustomerNav />
          {children}
        </div>
      </CustomerCartProvider>
    </CustomerAuthProvider>
  );
}
