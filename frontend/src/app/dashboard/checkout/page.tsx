'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Minus, Plus, Trash2, ShoppingBag, Lock } from 'lucide-react';
import { useCustomerCart } from '@/lib/customer-cart';
import { useCustomerAuth, customerFetch } from '@/lib/customer-auth';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', minimumFractionDigits: 2 }).format(value);
}

type Channel = 'TAKEAWAY' | 'DINE_IN' | 'DELIVERY';

interface CreatedOrder {
  id: string;
  total: number | string;
}

interface PayResponse {
  authorizationUrl: string;
  reference: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const cart = useCustomerCart();
  const { customer, loading } = useCustomerAuth();
  const [channel, setChannel] = useState<Channel>('TAKEAWAY');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !customer) {
      router.replace('/dashboard/login?next=/dashboard/checkout');
    }
  }, [loading, customer, router]);

  const handlePay = async () => {
    if (cart.items.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const order = await customerFetch<CreatedOrder>('/api/v1/public/customer/orders', {
        method: 'POST',
        body: JSON.stringify({
          channel,
          notes: notes.trim() || undefined,
          items: cart.items.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            notes: item.notes,
          })),
        }),
      });

      const payment = await customerFetch<PayResponse>(`/api/v1/public/customer/orders/${order.id}/pay`, {
        method: 'POST',
        body: JSON.stringify({
          paymentMethod: 'CARD',
          paymentLabel: 'Paystack',
        }),
      });

      cart.clear();
      sessionStorage.setItem('crave_customer_last_order', order.id);
      window.location.href = payment.authorizationUrl;
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  };

  if (loading || !customer) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[#b5451b]" />
      </main>
    );
  }

  if (cart.items.length === 0) {
    return (
      <main className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-md flex-col items-center rounded-[2rem] border border-[#ebdcc5] bg-white p-10 text-center shadow-sm">
          <ShoppingBag size={36} className="text-[#b5451b]" />
          <h1 className="mt-4 text-xl font-bold text-[#26130f]">Your cart is empty</h1>
          <p className="mt-2 text-sm text-[#5f4a38]">Add some delicious dishes to get started.</p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#26130f] px-5 py-3 text-sm font-semibold text-white hover:bg-[#3a1f17]"
          >
            Browse the menu
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="px-4 pb-24 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-[2rem] border border-[#ebdcc5] bg-white p-5 shadow-sm sm:p-7">
          <h1 className="text-xl font-bold text-[#26130f] sm:text-2xl">Review your order</h1>
          <ul className="mt-5 divide-y divide-[#f1e3cc]">
            {cart.items.map((item) => (
              <li key={item.menuItemId} className="flex gap-4 py-4">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-[#f1e6d4]">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#26130f]">{item.name}</p>
                      <p className="mt-1 text-xs text-[#5f4a38]">{formatCurrency(item.unitPrice)} each</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => cart.remove(item.menuItemId)}
                      className="rounded-full p-2 text-[#9a3f1a] transition hover:bg-[#fbe9dd]"
                      aria-label="Remove"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#e3d1b6] bg-[#fdf8f2] px-2 py-1">
                      <button
                        type="button"
                        onClick={() => cart.updateQuantity(item.menuItemId, item.quantity - 1)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#26130f] shadow"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => cart.updateQuantity(item.menuItemId, item.quantity + 1)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#26130f] shadow"
                        aria-label="Increase quantity"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <span className="text-sm font-semibold text-[#26130f]">
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-6 space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5f4a38]">Order type</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(['TAKEAWAY', 'DINE_IN', 'DELIVERY'] as Channel[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setChannel(c)}
                    className={`rounded-2xl px-3 py-2 text-xs font-semibold uppercase tracking-[0.15em] transition ${
                      channel === c
                        ? 'bg-[#26130f] text-white'
                        : 'border border-[#e3d1b6] bg-[#fdf8f2] text-[#5f4a38] hover:border-[#b5451b]'
                    }`}
                  >
                    {c === 'DINE_IN' ? 'Dine in' : c === 'TAKEAWAY' ? 'Takeaway' : 'Delivery'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5f4a38]">
                Notes for the kitchen (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="mt-2 w-full resize-none rounded-2xl border border-[#e3d1b6] bg-[#fdf8f2] px-4 py-3 text-sm outline-none focus:border-[#b5451b]"
                placeholder="Allergies, spice preference, etc."
              />
            </div>
          </div>
        </section>

        <aside className="rounded-[2rem] border border-[#ebdcc5] bg-white p-5 shadow-sm sm:p-7 lg:sticky lg:top-24 lg:self-start">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#5f4a38]">Summary</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-[#5f4a38]">Items</dt>
              <dd className="font-semibold text-[#26130f]">{cart.count}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-[#5f4a38]">Subtotal</dt>
              <dd className="font-semibold text-[#26130f]">{formatCurrency(cart.subtotal)}</dd>
            </div>
          </dl>
          <div className="my-4 border-t border-dashed border-[#e3d1b6]" />
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-semibold uppercase tracking-[0.2em] text-[#5f4a38]">Total</span>
            <span className="text-2xl font-bold text-[#26130f]">{formatCurrency(cart.subtotal)}</span>
          </div>
          {error && <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          <button
            type="button"
            onClick={handlePay}
            disabled={submitting}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#b5451b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#9a3f1a] disabled:opacity-60"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
            Pay securely with Paystack
          </button>
          <p className="mt-3 text-center text-[11px] text-[#8c6f56]">
            You&apos;ll be redirected to Paystack to complete payment.
          </p>
        </aside>
      </div>
    </main>
  );
}
