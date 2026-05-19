'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle2, Clock, RefreshCw, AlertTriangle } from 'lucide-react';
import { useCustomerAuth, customerFetch } from '@/lib/customer-auth';

interface OrderDetail {
  id: string;
  status: string;
  total: number | string;
  subtotal?: number | string;
  paymentStatus?: string | null;
  paymentMethod?: string | null;
  paymentLabel?: string | null;
  paymentReference?: string | null;
  paidAt?: string | null;
  channel?: string;
  notes?: string | null;
  createdAt: string;
  items: {
    id: string;
    quantity: number;
    unitPrice: number | string;
    menuItem?: { name: string; imageUrl?: string | null };
    notes?: string | null;
  }[];
}

function formatCurrency(value: number | string) {
  return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', minimumFractionDigits: 2 }).format(Number(value));
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

export default function CustomerOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const search = useSearchParams();
  const { customer, loading } = useCustomerAuth();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !customer) {
      router.replace(`/dashboard/login?next=/dashboard/orders/${id}`);
    }
  }, [loading, customer, router, id]);

  const load = useCallback(async () => {
    try {
      const data = await customerFetch<OrderDetail>(`/api/v1/public/customer/orders/${id}`);
      setOrder(data);
    } catch (err) {
      setError((err as Error).message);
    }
  }, [id]);

  const verify = useCallback(async () => {
    setVerifying(true);
    setVerifyMessage(null);
    try {
      const data = await customerFetch<OrderDetail>(`/api/v1/public/customer/orders/${id}/verify`, { method: 'POST' });
      setOrder(data);
      setVerifyMessage(
        data.paymentStatus === 'SUCCESS' ? 'Payment confirmed.' : 'Payment is still pending. Try again shortly.',
      );
    } catch (err) {
      setVerifyMessage((err as Error).message);
    } finally {
      setVerifying(false);
    }
  }, [id]);

  useEffect(() => {
    if (!customer) return;
    load();
  }, [customer, load]);

  // Auto-verify when returning from Paystack (reference present in URL)
  useEffect(() => {
    if (!customer) return;
    if (search.get('reference') || search.get('trxref')) {
      verify();
    }
  }, [customer, search, verify]);

  // Poll while pending payment
  useEffect(() => {
    if (!order || order.paymentStatus === 'SUCCESS' || order.paymentStatus === 'FAILED') return;
    if (!order.paymentReference) return;
    const interval = window.setInterval(() => {
      verify();
    }, 8000);
    return () => window.clearInterval(interval);
  }, [order, verify]);

  if (loading || !customer || (!order && !error)) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[#b5451b]" />
      </main>
    );
  }

  if (error && !order) {
    return (
      <main className="px-4 py-16">
        <div className="mx-auto max-w-md rounded-3xl bg-red-50 p-8 text-center text-sm text-red-700">{error}</div>
      </main>
    );
  }

  if (!order) return null;

  const paymentStatus = order.paymentStatus || 'PENDING';
  const PaymentIcon = paymentStatus === 'SUCCESS' ? CheckCircle2 : paymentStatus === 'FAILED' ? AlertTriangle : Clock;
  const paymentColor =
    paymentStatus === 'SUCCESS'
      ? 'text-emerald-600 bg-emerald-50'
      : paymentStatus === 'FAILED'
        ? 'text-red-600 bg-red-50'
        : 'text-amber-600 bg-amber-50';

  return (
    <main className="px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-5">
        <div className="rounded-[2rem] border border-[#ebdcc5] bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-[#b86e2c]">Order</p>
              <h1 className="mt-2 text-2xl font-bold text-[#26130f]">#{order.id.slice(-6).toUpperCase()}</h1>
              <p className="mt-1 text-xs text-[#5f4a38]">{new Date(order.createdAt).toLocaleString()}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] ${statusClass(order.status)}`}>
              {order.status}
            </span>
          </div>

          <div className={`mt-5 flex items-start gap-3 rounded-2xl px-4 py-4 ${paymentColor}`}>
            <PaymentIcon size={22} className="mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold">
                {paymentStatus === 'SUCCESS' ? 'Payment received' : paymentStatus === 'FAILED' ? 'Payment failed' : 'Awaiting payment'}
              </p>
              <p className="mt-1 text-xs opacity-80">
                {paymentStatus === 'SUCCESS'
                  ? `Paid ${order.paidAt ? new Date(order.paidAt).toLocaleString() : ''}`
                  : paymentStatus === 'PENDING'
                    ? 'Complete your payment to confirm this order.'
                    : 'Please try again or contact support.'}
              </p>
              {order.paymentReference && (
                <p className="mt-1 text-[11px] uppercase tracking-[0.15em] opacity-70">Ref: {order.paymentReference}</p>
              )}
            </div>
            {paymentStatus !== 'SUCCESS' && order.paymentReference && (
              <button
                type="button"
                onClick={verify}
                disabled={verifying}
                className="inline-flex items-center gap-2 rounded-full border border-current px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
              >
                <RefreshCw size={12} className={verifying ? 'animate-spin' : ''} />
                Refresh
              </button>
            )}
          </div>
          {verifyMessage && <p className="mt-3 text-xs text-[#5f4a38]">{verifyMessage}</p>}
        </div>

        <section className="rounded-[2rem] border border-[#ebdcc5] bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#5f4a38]">Items</h2>
          <ul className="mt-4 divide-y divide-[#f1e3cc]">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 py-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-[#f1e6d4]">
                  {item.menuItem?.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.menuItem.imageUrl} alt={item.menuItem?.name || 'item'} className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#26130f]">
                    {item.menuItem?.name || 'Item'} <span className="text-[#5f4a38]">× {item.quantity}</span>
                  </p>
                  {item.notes && <p className="text-xs text-[#5f4a38]">{item.notes}</p>}
                </div>
                <span className="text-sm font-semibold text-[#26130f]">
                  {formatCurrency(Number(item.unitPrice) * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex items-center justify-between border-t border-dashed border-[#e3d1b6] pt-4">
            <span className="text-sm font-semibold uppercase tracking-[0.2em] text-[#5f4a38]">Total</span>
            <span className="text-xl font-bold text-[#26130f]">{formatCurrency(order.total)}</span>
          </div>
        </section>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/orders"
            className="inline-flex items-center justify-center rounded-full border border-[#e3d1b6] bg-white px-5 py-3 text-sm font-semibold text-[#26130f] hover:bg-[#fdf3e3]"
          >
            All orders
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-full bg-[#26130f] px-5 py-3 text-sm font-semibold text-white hover:bg-[#3a1f17]"
          >
            Order again
          </Link>
        </div>
      </div>
    </main>
  );
}
