'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Plus, Check, ShoppingBag, Search } from 'lucide-react';
import Link from 'next/link';
import { API_BASE } from '@/lib/constants';
import { useCustomerCart } from '@/lib/customer-cart';
import { useCustomerAuth } from '@/lib/customer-auth';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

async function publicGet<T>(path: string): Promise<T> {
  const base = API_BASE || (typeof window !== 'undefined' ? window.location.origin : '');
  const res = await fetch(`${base}${path}`);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return (await res.json()) as T;
}

interface Category {
  id: string;
  name: string;
}

interface MenuItem {
  id: string;
  name: string;
  description?: string | null;
  price: number | string;
  available: boolean;
  imageUrl?: string | null;
  category?: Category | null;
  categoryId?: string;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', minimumFractionDigits: 2 }).format(value);
}

export default function CustomerMenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState<string | null>(null);

  const cart = useCustomerCart();
  const { customer } = useCustomerAuth();
  const greeting = getGreeting();
  const firstName = customer?.name?.split(' ')[0] ?? null;
  const featuredImage = items.find((i) => i.imageUrl)?.imageUrl ?? null;

  useEffect(() => {
    Promise.all([
      publicGet<MenuItem[]>('/api/v1/public/menu/items?limit=200'),
      publicGet<Category[]>('/api/v1/public/menu/categories?limit=100'),
    ])
      .then(([menuItems, cats]) => {
        setItems(menuItems);
        setCategories(cats);
      })
      .catch((err) => setError(err.message || 'Unable to load menu'))
      .finally(() => setLoading(false));
  }, []);

  const visibleItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((item) => {
      if (!item.available) return false;
      if (activeCategory !== 'ALL' && item.category?.id !== activeCategory && item.categoryId !== activeCategory) return false;
      if (term && !item.name.toLowerCase().includes(term) && !(item.description ?? '').toLowerCase().includes(term)) return false;
      return true;
    });
  }, [items, activeCategory, search]);

  const handleAdd = (item: MenuItem) => {
    cart.add({
      menuItemId: item.id,
      name: item.name,
      imageUrl: item.imageUrl,
      unitPrice: Number(item.price),
    });
    setJustAdded(item.id);
    window.setTimeout(() => {
      setJustAdded((current) => (current === item.id ? null : current));
    }, 1200);
  };

  return (
    <main className="px-4 pb-32 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">

        {/* ── Hero ── */}
        <section className="relative mb-8 overflow-hidden rounded-[2.5rem] bg-[#1a1209] shadow-[0_32px_80px_rgba(26,18,9,0.25)]">
          {featuredImage && (
            <div className="absolute inset-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={featuredImage} alt="" className="h-full w-full object-cover opacity-[0.22]" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#1a1209] via-[#1a1209]/90 to-[#1a1209]/50" />
            </div>
          )}
          <div className="relative flex flex-col gap-6 p-7 sm:flex-row sm:items-center sm:justify-between sm:p-10">
            <div className="max-w-2xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.45em] text-[#e8a45a]">
                {greeting}{firstName ? `, ${firstName}` : ''}
              </p>
              <h1 className="mt-2 text-3xl font-bold leading-[1.15] text-white sm:text-[2.75rem]">
                Fresh West African flavours,{' '}
                <span className="text-[#e8a45a]">ready in minutes.</span>
              </h1>
              <p className="mt-3 max-w-lg text-sm leading-7 text-white/55 sm:text-[0.95rem]">
                Browse the menu, build your order, and pay securely with Paystack.
                Track your order in real time.
              </p>
              {!loading && (
                <div className="mt-5 flex items-center gap-6">
                  <div>
                    <div className="text-2xl font-bold text-white">{items.filter((i) => i.available).length}</div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">Dishes</div>
                  </div>
                  <div className="h-8 w-px bg-white/10" />
                  <div>
                    <div className="text-2xl font-bold text-white">{categories.length}</div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">Categories</div>
                  </div>
                </div>
              )}
            </div>
            <Link
              href="/dashboard/orders"
              className="inline-flex items-center justify-center gap-2 self-start rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20 sm:self-center"
            >
              My orders <ArrowRight size={15} />
            </Link>
          </div>
        </section>

        {/* ── Search + Category filter ── */}
        <section className="-mx-4 mb-6 border-b border-[#ebdcc5] bg-[#fdf8f2]/95 px-4 py-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="mx-auto flex max-w-6xl flex-col gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a08770]" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search dishes…"
                className="w-full rounded-full border border-[#e3d1b6] bg-white py-3 pl-10 pr-5 text-sm text-[#26130f] shadow-sm outline-none placeholder:text-[#a08770] focus:border-[#b5451b] focus:ring-2 focus:ring-[#b5451b]/10"
              />
            </div>
            <div className="-mx-1 flex gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setActiveCategory('ALL')}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                  activeCategory === 'ALL'
                    ? 'bg-[#26130f] text-white shadow-sm'
                    : 'border border-[#e3d1b6] bg-white text-[#5f4a38] hover:border-[#b5451b] hover:text-[#b5451b]'
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                    activeCategory === cat.id
                      ? 'bg-[#26130f] text-white shadow-sm'
                      : 'border border-[#e3d1b6] bg-white text-[#5f4a38] hover:border-[#b5451b] hover:text-[#b5451b]'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section>
          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="h-72 animate-pulse rounded-3xl bg-white/70" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-3xl bg-red-50 p-8 text-center text-sm text-red-700 shadow-sm">{error}</div>
          ) : visibleItems.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#e3d1b6] bg-white p-10 text-center text-sm text-[#5f4a38]">
              No dishes match this filter yet.
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {visibleItems.map((item) => {
                const price = Number(item.price);
                const added = justAdded === item.id;
                return (
                  <article
                    key={item.id}
                    className="group flex flex-col overflow-hidden rounded-[2rem] border border-[#ebdcc5] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-2xl"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-[#f1e6d4]">
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs uppercase tracking-[0.35em] text-[#a08770]">
                          Crave classic
                        </div>
                      )}
                      {item.category?.name && (
                        <span className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white backdrop-blur">
                          {item.category.name}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-3 p-5">
                      <div>
                        <h3 className="text-lg font-semibold text-[#26130f]">{item.name}</h3>
                        {item.description && (
                          <p className="mt-1 line-clamp-2 text-sm leading-6 text-[#5f4a38]">{item.description}</p>
                        )}
                      </div>
                      <div className="mt-auto flex items-center justify-between gap-3">
                        <span className="text-lg font-semibold text-[#26130f]">{formatCurrency(price)}</span>
                        <button
                          type="button"
                          onClick={() => handleAdd(item)}
                          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] transition ${
                            added ? 'bg-emerald-500 text-white' : 'bg-[#b5451b] text-white hover:bg-[#9a3f1a]'
                          }`}
                        >
                          {added ? <Check size={14} /> : <Plus size={14} />}
                          {added ? 'Added' : 'Add'}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {cart.count > 0 && (
        <Link
          href="/dashboard/checkout"
          className="fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-md items-center justify-between gap-3 rounded-full bg-[#26130f] px-5 py-4 text-white shadow-2xl transition hover:bg-[#3a1f17] sm:inset-x-auto sm:right-6"
        >
          <span className="inline-flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
              <ShoppingBag size={16} />
            </span>
            <span className="text-sm font-semibold">
              {cart.count} item{cart.count > 1 ? 's' : ''} · {formatCurrency(cart.subtotal)}
            </span>
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.2em]">
            Checkout <ArrowRight size={14} />
          </span>
        </Link>
      )}
    </main>
  );
}
