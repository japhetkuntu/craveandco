'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, ChevronRight, Receipt } from 'lucide-react';
import { useCustomerAuth, customerFetch } from '@/lib/customer-auth';

interface OrderListItem {
  id: string;
  status: string;
  total: number | string;
  paymentStatus?: string | null;
  createdAt: string;
  items?: { quantity: number }[];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', minimumFractionDigits: 2 }).format(value);
}

function statusClass(status: string) {
  switch (status) {
    case 'NEW':
      return 'bg-amber-100 text-amber-800';
    case 'PREPARING':
      return 'bg-blue-100 text-blue-800';
    case 'READY':
      return 'bg-emerald-100 text-emerald-800';
    case 'COMPLETED':
      return 'bg-emerald-600/10 text-emerald-700';
    case 'CANCELLED':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

function paymentBadge(status?: string | null) {
  if (!status) return null;
  const map: Record<string, string> = {
    SUCCESS: 'bg-emerald-100 text-emerald-700',
    PENDING: 'bg-amber-100 text-amber-800',
    FAILED: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] ${map[status] || 'bg-slate-100 text-slate-700'}`}>
      {status}
    </span>
  );
}

export default function CustomerOrdersPage() {
  const router = useRouter();
  const { customer, loading } = useCustomerAuth();
  const [orders, setOrders] = useState<OrderListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !customer) {
      router.replace('/dashboard/login?next=/dashboard/orders');
    }
  }, [loading, customer, router]);

  useEffect(() => {
    if (!customer) return;
    customerFetch<OrderListItem[]>('/api/v1/public/customer/orders?limit=50')
      .then(setOrders)
      .catch((err) => setError((err as Error).message));
  }, [customer]);

  if (loading || !customer) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[#b5451b]" />
      </main>
    );
  }

  return (
    <main className="px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6 flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-[#b86e2c]">Hello {customer.name.split(' ')[0]}</p>
            <h1 className="mt-2 text-2xl font-bold text-[#26130f] sm:text-3xl">Your orders</h1>
          </div>
          <Link href="/dashboard" className="text-sm font-semibold text-[#b5451b] hover:underline">
            Order more
          </Link>
        </header>

        {error && <p className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        {orders === null ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/70" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-[#e3d1b6] bg-white p-10 text-center">
            <Receipt size={36} className="mx-auto text-[#b5451b]" />
            <p className="mt-3 text-sm text-[#5f4a38]">You haven&apos;t placed any orders yet.</p>
            <Link
              href="/dashboard"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#26130f] px-5 py-3 text-sm font-semibold text-white hover:bg-[#3a1f17]"
            >
              Browse the menu
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {orders.map((order) => {
              const itemsCount = order.items?.reduce((s, i) => s + i.quantity, 0) ?? 0;
              const date = new Date(order.createdAt);
              return (
                <li key={order.id}>
                  <Link
                    href={`/dashboard/orders/${order.id}`}
                    className="flex items-center gap-4 rounded-2xl border border-[#ebdcc5] bg-white p-4 transition hover:border-[#b5451b]/40 hover:shadow-md"
                  >
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] ${statusClass(order.status)}`}>
                          {order.status}
                        </span>
                        {paymentBadge(order.paymentStatus)}
                      </div>
                      <p className="mt-2 text-sm font-semibold text-[#26130f]">
                        Order #{order.id.slice(-6).toUpperCase()}
                      </p>
                      <p className="text-xs text-[#5f4a38]">
                        {itemsCount} item{itemsCount === 1 ? '' : 's'} · {date.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#26130f]">{formatCurrency(Number(order.total))}</p>
                      <ChevronRight size={16} className="ml-auto mt-2 text-[#a08770]" />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
