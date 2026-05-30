'use client';

import { useState, useEffect, useMemo } from 'react';
import { Phone, Menu, X, MessageCircle, ChevronLeft, Search, MapPin, Truck, Store } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { API_BASE } from '@/lib/constants';
import { ECOMMERCE_ENABLED } from '@/lib/feature-flags';
import { ContactOrderModal, CONTACT_WHATSAPP_LINK } from '@/components/ui/contact-order-modal';

async function publicGet<T>(path: string): Promise<T> {
  const base = API_BASE || (typeof window !== 'undefined' ? window.location.origin : '');
  const res = await fetch(`${base}${path}`);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return (await res.json()) as T;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', minimumFractionDigits: 2 }).format(value);
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

export default function MenuPage() {
  const searchParams = useSearchParams();
  const [navOpen, setNavOpen] = useState(false);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = navOpen ? 'hidden' : '';
  }, [navOpen]);

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

  const [showFloatingCTA, setShowFloatingCTA] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowFloatingCTA(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
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

  const categoryItemCount = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((item) => {
      if (!item.available) return;
      const catId = item.category?.id ?? item.categoryId;
      if (catId) counts[catId] = (counts[catId] ?? 0) + 1;
    });
    return counts;
  }, [items]);

  const groupedItems = useMemo(() => {
    if (activeCategory !== 'ALL') {
      const cat = categories.find((c) => c.id === activeCategory);
      return [{ category: cat ?? null, items: visibleItems }];
    }
    const grouped: Record<string, MenuItem[]> = {};
    const uncategorized: MenuItem[] = [];
    visibleItems.forEach((item) => {
      const catId = item.category?.id ?? item.categoryId;
      if (catId) {
        if (!grouped[catId]) grouped[catId] = [];
        grouped[catId].push(item);
      } else {
        uncategorized.push(item);
      }
    });
    const groups: { category: Category | null; items: MenuItem[] }[] = [];
    categories.forEach((cat) => {
      if (grouped[cat.id]?.length) groups.push({ category: cat, items: grouped[cat.id] });
    });
    if (uncategorized.length) groups.push({ category: null, items: uncategorized });
    // Categories where at least one item has an image float to the top
    groups.sort((a, b) => {
      const aHasImg = a.items.some((i) => !!i.imageUrl) ? 0 : 1;
      const bHasImg = b.items.some((i) => !!i.imageUrl) ? 0 : 1;
      return aHasImg - bHasImg;
    });
    return groups;
  }, [visibleItems, categories, activeCategory]);

  const [cart, setCart] = useState<Record<string, number>>({});
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const cartItemCount = useMemo(() => Object.values(cart).reduce((s, n) => s + n, 0), [cart]);
  const cartTotal = useMemo(
    () => items.reduce((s, item) => s + (cart[item.id] ?? 0) * Number(item.price), 0),
    [cart, items],
  );
  const raffleCode = useMemo(() => {
    const raw = (searchParams.get('raffle') ?? '').trim().toUpperCase();
    const normalized = raw.replace(/[^A-Z0-9]/g, '').slice(0, 8);
    return normalized.length === 8 ? normalized : null;
  }, [searchParams]);

  const buildWhatsAppOrder = () => {
    const lines = items
      .filter((item) => (cart[item.id] ?? 0) > 0)
      .map((item) => `• ${cart[item.id]}\u00d7 ${item.name} \u2014 ${formatCurrency(Number(item.price) * (cart[item.id] ?? 1))}`)
      .join('\n');
    const deliveryLine = deliveryType === 'delivery'
      ? `\nDelivery to: ${deliveryLocation.trim() || '(location to be shared in chat)'}`
      : '\nPickup from Crave & Co. (Ashongman Estate, Accra)';
    const raffleLine = raffleCode
      ? `\nRaffle Code: ${raffleCode}`
      : '';
    const msg = `Hi! I\u2019d like to place an order from Crave & Co. \uD83C\uDF7D\uFE0F\n\n${lines}\n\nSubtotal: ${formatCurrency(cartTotal)}${deliveryLine}${raffleLine}\n\nPlease confirm. Thank you! \uD83D\uDE4F`;
    return `https://wa.me/233540951665?text=${encodeURIComponent(msg)}`;
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Lato:wght@300;400;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { font-family: 'Lato', sans-serif; background: #fdf8f2; color: #1a1209; overflow-x: hidden; }

        :root {
          --terracotta: #b5451b;
          --cream: #fdf8f2;
          --espresso: #1a1209;
          --bark: #7c5c2e;
        }

        .font-display { font-family: 'Playfair Display', serif; }

        .hidden-mobile { display: flex; }
        .show-mobile { display: none !important; }
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
        }

        .drawer-overlay {
          position: fixed; inset: 0; z-index: 9998;
          background: rgba(26,18,9,0.55); backdrop-filter: blur(4px);
          opacity: 0; pointer-events: none; transition: opacity 0.3s;
        }
        .drawer-overlay.open { opacity: 1; pointer-events: all; }
        .drawer {
          position: fixed; top: 0; right: 0; bottom: 0; z-index: 9999;
          width: min(300px, 85vw); background: var(--cream);
          transform: translateX(100%);
          transition: transform 0.35s cubic-bezier(0.4,0,0.2,1);
          display: flex; flex-direction: column; padding: 2rem;
          border-left: 1px solid rgba(124,92,46,0.15);
        }
        .drawer.open { transform: translateX(0); }

        .menu-card {
          background: #fff;
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid rgba(124,92,46,0.1);
          box-shadow: 0 2px 16px rgba(26,18,9,0.06);
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .menu-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 32px rgba(26,18,9,0.12);
        }
        .menu-card-img {
          width: 100%; height: 220px; object-fit: cover; display: block;
          transition: transform 0.4s ease;
        }
        .menu-card:hover .menu-card-img { transform: scale(1.04); }
        .menu-card-accent-bar {
          height: 4px;
          background: linear-gradient(90deg, var(--terracotta) 0%, #d4a017 60%, rgba(253,248,242,0) 100%);
          border-radius: 20px 20px 0 0;
        }
        @media (max-width: 480px) {
          .menu-card-img { height: 180px; }
        }
        .menu-search-wrap { position: relative; display: flex; align-items: center; }
        .menu-search-icon { position: absolute; left: 1rem; color: var(--bark); pointer-events: none; }
        .menu-search-input {
          width: 100%; padding: 0.75rem 1rem 0.75rem 2.75rem;
          border-radius: 999px; border: 1px solid rgba(124,92,46,0.25);
          background: #fff; font-family: 'Lato', sans-serif; font-size: 0.9rem;
          color: var(--espresso); outline: none; box-shadow: 0 2px 8px rgba(26,18,9,0.06);
        }
        .menu-search-input:focus { border-color: var(--terracotta); box-shadow: 0 0 0 3px rgba(181,69,27,0.12); }
        .menu-search-input::placeholder { color: var(--bark); }
        .filter-chips { display: flex; gap: 0.5rem; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none; }
        .filter-chips::-webkit-scrollbar { display: none; }
        .filter-chip {
          flex-shrink: 0; padding: 0.6rem 1rem; border-radius: 999px;
          font-family: 'Lato', sans-serif; font-weight: 700; font-size: 11px;
          letter-spacing: 0.15em; text-transform: uppercase; cursor: pointer;
          transition: all 0.2s; border: 1px solid rgba(124,92,46,0.25);
          background: #fff; color: var(--bark); min-height: 44px;
        }
        .filter-chip:hover { border-color: var(--terracotta); color: var(--terracotta); }
        .filter-chip.active { background: var(--espresso); color: #fff; border-color: var(--espresso); }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        .skeleton { animation: pulse 1.5s ease-in-out infinite; background: rgba(124,92,46,0.1); border-radius: 20px; }
        @keyframes shimmer-text { 0% { background-position: 200% center; } 100% { background-position: -200% center; } }
        .hero-shimmer {
          background: linear-gradient(90deg, #ffffff 0%, rgba(253,216,154,1) 30%, #ffffff 50%, rgba(253,216,154,1) 70%, #ffffff 100%);
          background-size: 200% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text; animation: shimmer-text 6s linear infinite;
        }
        .add-btn {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 0.625rem 1.2rem; border-radius: 999px;
          background: var(--espresso); color: #fff; border: none; cursor: pointer;
          font-family: 'Lato', sans-serif; font-weight: 700; font-size: 0.78rem;
          letter-spacing: 0.06em; transition: background 0.2s, transform 0.15s; flex-shrink: 0;
          min-height: 44px;
        }
        .add-btn:hover { background: var(--terracotta); transform: translateY(-1px); }
        .qty-row {
          display: inline-flex; align-items: center; border-radius: 999px;
          border: 1.5px solid var(--espresso); overflow: hidden; flex-shrink: 0;
        }
        .qty-btn {
          width: 38px; height: 38px; min-width: 38px; display: flex; align-items: center; justify-content: center;
          background: none; border: none; cursor: pointer; color: var(--espresso);
          font-size: 1.1rem; font-weight: 700; line-height: 1;
          transition: background 0.15s, color 0.15s;
        }
        .qty-btn:hover { background: var(--espresso); color: #fff; }
        .qty-count {
          min-width: 28px; text-align: center; font-family: 'Lato', sans-serif;
          font-weight: 700; font-size: 0.9rem; color: var(--espresso);
        }
        .menu-floating-cta {
          position: fixed;
          bottom: calc(1.75rem + env(safe-area-inset-bottom, 0px));
          left: 50%; z-index: 999;
          transform: translateX(-50%) translateY(80px);
          opacity: 0; pointer-events: none;
          transition: transform 0.45s cubic-bezier(0.34,1.56,0.64,1), opacity 0.35s ease;
        }
        .menu-floating-cta.visible { transform: translateX(-50%) translateY(0); opacity: 1; pointer-events: all; }
        .order-tray {
          position: fixed;
          bottom: calc(1.75rem + env(safe-area-inset-bottom, 0px));
          left: 50%; z-index: 1000;
          transform: translateX(-50%) translateY(120px);
          opacity: 0; pointer-events: none;
          transition: transform 0.5s cubic-bezier(0.34,1.56,0.64,1), opacity 0.35s ease;
          width: min(540px, calc(100vw - 2rem));
        }
        .order-tray.visible { transform: translateX(-50%) translateY(0); opacity: 1; pointer-events: all; }
        .order-tray-inner {
          display: flex; flex-direction: column; gap: 0.75rem;
        }
        .order-tray-row {
          display: flex; align-items: center; justify-content: space-between; gap: 1rem;
        }
        @media (max-width: 440px) {
          .order-tray-row { flex-wrap: wrap; }
          .order-tray-row > a { width: 100%; justify-content: center; }
        }
        .delivery-toggle {
          display: flex; gap: 0.4rem;
          border-top: 1px solid rgba(255,255,255,0.07);
          padding-top: 0.75rem;
        }
        .delivery-btn {
          flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 6px;
          padding: 0.5rem 0.75rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.12);
          background: transparent; color: rgba(255,255,255,0.45);
          font-family: 'Lato', sans-serif; font-weight: 700; font-size: 0.78rem;
          letter-spacing: 0.06em; cursor: pointer;
          transition: all 0.2s; min-height: 44px;
        }
        .delivery-btn.active {
          background: rgba(255,255,255,0.1); color: #fff;
          border-color: rgba(255,255,255,0.28);
        }
        .delivery-btn.active.delivery { background: rgba(181,69,27,0.25); border-color: rgba(181,69,27,0.55); color: #f8c39a; }
        .delivery-loc {
          overflow: hidden;
          max-height: 0;
          transition: max-height 0.3s ease, opacity 0.25s ease, margin-top 0.25s ease;
          opacity: 0; margin-top: 0;
        }
        .delivery-loc.open { max-height: 80px; opacity: 1; margin-top: 0.1rem; }
        .delivery-loc-wrap { position: relative; display: flex; align-items: center; }
        .delivery-loc-icon { position: absolute; left: 0.75rem; color: rgba(255,255,255,0.35); pointer-events: none; }
        .delivery-loc-input {
          width: 100%; padding: 0.6rem 0.75rem 0.6rem 2.25rem;
          background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.12);
          border-radius: 10px; color: #fff; font-family: 'Lato', sans-serif;
          font-size: 0.82rem; outline: none;
        }
        .delivery-loc-input::placeholder { color: rgba(255,255,255,0.3); }
        .delivery-loc-input:focus { border-color: rgba(181,69,27,0.6); background: rgba(255,255,255,0.1); }

        /* ── CATEGORY ZIGZAG LAYOUT ── */
        .cat-row {
          display: flex; flex-direction: row;
          gap: clamp(1.5rem, 4vw, 3rem); margin-bottom: clamp(3rem, 7vw, 5.5rem);
          align-items: flex-start;
        }
        .cat-row.zigzag { flex-direction: row-reverse; }
        .cat-side-header {
          flex: 0 0 clamp(140px, 18%, 210px); position: sticky; top: 80px;
          display: flex; flex-direction: column; gap: 0.6rem;
          padding-right: 1.75rem; border-right: 1.5px solid rgba(124,92,46,0.13);
        }
        .cat-row.zigzag .cat-side-header {
          padding-right: 0; padding-left: 1.75rem;
          border-right: none; border-left: 1.5px solid rgba(124,92,46,0.13);
          align-items: flex-end; text-align: right;
        }
        .cat-side-header::before {
          content: ''; display: block; width: 28px; height: 3px;
          background: linear-gradient(90deg, var(--terracotta) 0%, #d4a017 100%);
          border-radius: 2px; flex-shrink: 0;
        }
        .cat-row.zigzag .cat-side-header::before { margin-left: auto; }
        .cat-side-num {
          font-family: 'Playfair Display', serif; font-size: 2.5rem;
          font-weight: 900; font-style: italic;
          color: rgba(181,69,27,0.12); line-height: 1; user-select: none;
        }
        .cat-side-name {
          font-family: 'Playfair Display', serif;
          font-size: clamp(1.2rem, 2.5vw, 1.7rem);
          font-weight: 900; font-style: italic; color: var(--espresso); line-height: 1.15;
        }
        .cat-side-count {
          display: inline-flex; font-family: 'Lato', sans-serif; font-weight: 700;
          font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase;
          color: var(--bark); background: rgba(124,92,46,0.08);
          border: 1px solid rgba(124,92,46,0.15); padding: 3px 10px;
          border-radius: 999px; align-self: flex-start;
        }
        .cat-row.zigzag .cat-side-count { align-self: flex-end; }
        .cat-items-grid {
          flex: 1; min-width: 0; display: grid;
          grid-template-columns: repeat(auto-fill, minmax(min(250px, 100%), 1fr));
          gap: clamp(1rem, 2.5vw, 1.5rem); align-content: start;
        }
        @media (max-width: 620px) {
          .cat-row, .cat-row.zigzag { flex-direction: column; gap: 1rem; }
          .cat-side-header {
            flex: none; position: static;
            flex-direction: row; flex-wrap: wrap; align-items: center;
            padding-right: 0; padding-left: 0; border-right: none; border-left: none;
            padding-bottom: 0.75rem; border-bottom: 1.5px solid rgba(124,92,46,0.12);
            gap: 0.4rem 0.75rem; text-align: left;
          }
          .cat-row.zigzag .cat-side-header { align-items: center; text-align: left; }
          .cat-side-header::before { display: none; }
          .cat-side-num { font-size: 1.6rem; }
          .cat-side-name { font-size: 1.3rem; }
          .cat-side-count, .cat-row.zigzag .cat-side-count { align-self: center; }
          .cat-items-grid { grid-template-columns: 1fr; width: 100%; }
        }
        .menu-card-desc {
          font-family: 'Lato', sans-serif; font-size: 0.875rem;
          color: var(--bark); line-height: 1.65;
          display: -webkit-box; -webkit-line-clamp: 2;
          -webkit-box-orient: vertical; overflow: hidden;
        }
        .menu-sticky-bar {
          position: sticky; top: 64px; z-index: 100;
          background: rgba(253,248,242,0.97);
          backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
          border-bottom: 1px solid rgba(124,92,46,0.1);
          box-shadow: 0 2px 12px rgba(26,18,9,0.05);
        }
        @keyframes statsFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .stats-fade { animation: statsFadeIn 0.4s ease forwards; }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(1rem, 5vw, 2.5rem)',
        background: 'rgba(253,248,242,0.97)',
        backdropFilter: 'blur(14px)',
        borderBottom: '1px solid rgba(124,92,46,0.12)',
      }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span className="font-display" style={{
            fontSize: '1.25rem', fontWeight: 900, fontStyle: 'italic',
            color: 'var(--espresso)',
          }}>
            Crave <span style={{ color: 'var(--terracotta)', fontStyle: 'normal' }}>&</span> Co.
          </span>
        </Link>

        <div className="hidden-mobile" style={{ gap: '2rem', alignItems: 'center' }}>
          <Link href="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontFamily: "'Lato',sans-serif", fontWeight: 700, fontSize: '0.8rem',
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: 'var(--bark)', textDecoration: 'none',
          }}>
            <ChevronLeft size={14} /> Home
          </Link>
          <span style={{
            fontFamily: "'Lato',sans-serif", fontWeight: 700, fontSize: '0.8rem',
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: 'var(--terracotta)',
          }}>
            Our Menu
          </span>
          <Link href="/#catering" style={{
            fontFamily: "'Lato',sans-serif", fontWeight: 700, fontSize: '0.8rem',
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: 'var(--bark)', textDecoration: 'none',
          }}>
            Catering
          </Link>
          {ECOMMERCE_ENABLED ? (
            <Link href="/dashboard" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'var(--terracotta)', color: '#fff',
              fontFamily: "'Lato',sans-serif", fontWeight: 700,
              fontSize: '0.8rem', letterSpacing: '0.06em',
              padding: '0.5rem 1.25rem', borderRadius: 999,
              textDecoration: 'none',
            }}>
              Order Now
            </Link>
          ) : (
            <button type="button" onClick={() => setOrderModalOpen(true)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#25D366', color: '#fff', border: 'none', cursor: 'pointer',
              fontFamily: "'Lato',sans-serif", fontWeight: 700,
              fontSize: '0.8rem', letterSpacing: '0.06em',
              padding: '0.5rem 1.25rem', borderRadius: 999,
            }}>
              <MessageCircle size={14} /> Order on WhatsApp
            </button>
          )}
        </div>

        <button
          onClick={() => setNavOpen(true)}
          className="show-mobile"
          aria-label="Open menu"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--espresso)' }}
        >
          <Menu size={26} />
        </button>
      </nav>

      {/* ── MOBILE DRAWER ── */}
      <div className={`drawer-overlay${navOpen ? ' open' : ''}`} onClick={() => setNavOpen(false)} />
      <div className={`drawer${navOpen ? ' open' : ''}`} role="dialog" aria-modal="true">
        <button
          onClick={() => setNavOpen(false)}
          style={{ alignSelf: 'flex-end', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--espresso)' }}
          aria-label="Close menu"
        >
          <X size={24} />
        </button>
        <span className="font-display" style={{
          fontSize: '1.5rem', fontWeight: 900, fontStyle: 'italic',
          marginTop: '2rem', marginBottom: '2.5rem', color: 'var(--espresso)',
        }}>
          Crave <span style={{ color: 'var(--terracotta)' }}>&</span> Co.
        </span>
        <Link href="/" onClick={() => setNavOpen(false)} style={{
          fontFamily: "'Lato',sans-serif", fontWeight: 700, fontSize: '1.1rem',
          color: 'var(--espresso)', textDecoration: 'none',
          padding: '0.75rem 0', borderBottom: '1px solid rgba(124,92,46,0.12)',
        }}>
          ← Home
        </Link>
        <span style={{
          display: 'block',
          fontFamily: "'Lato',sans-serif", fontWeight: 700, fontSize: '1.1rem',
          color: 'var(--terracotta)',
          padding: '0.75rem 0', borderBottom: '1px solid rgba(124,92,46,0.12)',
        }}>
          Our Menu
        </span>
        <Link href="/#catering" onClick={() => setNavOpen(false)} style={{
          fontFamily: "'Lato',sans-serif", fontWeight: 700, fontSize: '1.1rem',
          color: 'var(--espresso)', textDecoration: 'none',
          padding: '0.75rem 0', borderBottom: '1px solid rgba(124,92,46,0.12)',
          display: 'block',
        }}>
          Catering
        </Link>
        <a href="tel:0540951665" style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          marginTop: '2rem', background: 'var(--terracotta)', color: '#fff',
          fontFamily: "'Lato',sans-serif", fontWeight: 700, fontSize: '0.9rem',
          padding: '0.875rem 1.5rem', borderRadius: 999, textDecoration: 'none',
        }}>
          <Phone size={16} /> Call Us
        </a>
      </div>

      {/* ── PAGE HERO ── */}
      <header style={{
        background: 'var(--espresso)',
        paddingTop: 'calc(64px + clamp(3rem, 6vw, 5rem))',
        paddingBottom: 'clamp(3rem, 6vw, 5rem)',
        paddingLeft: 'clamp(1rem, 5vw, 2.5rem)',
        paddingRight: 'clamp(1rem, 5vw, 2.5rem)',
        textAlign: 'center',
        position: 'relative',
        zIndex: 0,
        flexShrink: 0,
      }}>
        {/* Kente stripe */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #b5451b 0%, #d4a017 33%, #2d6a4f 66%, #b5451b 100%)' }} />
        <p style={{
          display: 'inline-block',
          fontFamily: "'Lato',sans-serif", fontWeight: 700, fontSize: '10px',
          letterSpacing: '0.25em', textTransform: 'uppercase',
          color: 'rgba(253,216,154,0.7)',
          border: '1px solid rgba(253,216,154,0.2)',
          borderRadius: 999, padding: '5px 16px', marginBottom: '1.25rem',
        }}>
          Accra · Ghana · Est. 2026
        </p>
        <h1 className="font-display hero-shimmer" style={{
          fontSize: 'clamp(2.5rem, 7vw, 5rem)', fontWeight: 900,
          lineHeight: 1.05, letterSpacing: '-0.02em',
          marginBottom: '0.75rem',
        }}>
          Our Menu
        </h1>
        <p style={{
          fontFamily: "'Lato',sans-serif", fontWeight: 300,
          fontSize: 'clamp(1rem, 2.5vw, 1.15rem)',
          color: 'rgba(255,255,255,0.55)', maxWidth: 480, margin: '0 auto 2rem',
          lineHeight: 1.7,
        }}>
          Soulful West African flavours, made fresh every single day.
        </p>
        {!loading && (
          <div className="stats-fade" style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginBottom: '2rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div className="font-display" style={{ fontWeight: 900, fontSize: '2rem', color: '#fff', lineHeight: 1 }}>
                {items.filter((i) => i.available).length}
              </div>
              <div style={{ fontFamily: "'Lato',sans-serif", fontWeight: 700, fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginTop: '0.25rem' }}>Dishes</div>
            </div>
            {categories.length > 0 && (
              <>
                <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
                <div style={{ textAlign: 'center' }}>
                  <div className="font-display" style={{ fontWeight: 900, fontSize: '2rem', color: '#fff', lineHeight: 1 }}>
                    {categories.length}
                  </div>
                  <div style={{ fontFamily: "'Lato',sans-serif", fontWeight: 700, fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginTop: '0.25rem' }}>Categories</div>
                </div>
              </>
            )}
          </div>
        )}
        {!ECOMMERCE_ENABLED && (
          <button type="button" onClick={() => setOrderModalOpen(true)} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#25D366', color: '#fff', border: 'none', cursor: 'pointer',
            fontFamily: "'Lato',sans-serif", fontWeight: 700,
            fontSize: '0.9rem', letterSpacing: '0.04em',
            padding: '0.875rem 1.75rem', borderRadius: 999,
          }}>
            <MessageCircle size={16} /> Order on WhatsApp
          </button>
        )}
      </header>

      {/* ── STICKY FILTER BAR ── */}
      <div className="menu-sticky-bar">
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0.875rem clamp(1rem, 5vw, 2.5rem)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className="menu-search-wrap">
            <span className="menu-search-icon"><Search size={16} /></span>
            <input
              type="search"
              className="menu-search-input"
              placeholder="Search dishes…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="filter-chips">
            <button type="button" className={`filter-chip${activeCategory === 'ALL' ? ' active' : ''}`} onClick={() => setActiveCategory('ALL')}>
              All{items.filter((i) => i.available).length > 0 ? ` (${items.filter((i) => i.available).length})` : ''}
            </button>
            {categories.filter((cat) => !!categoryItemCount[cat.id]).map((cat) => (
              <button key={cat.id} type="button" className={`filter-chip${activeCategory === cat.id ? ' active' : ''}`} onClick={() => setActiveCategory(cat.id)}>
                {cat.name}{categoryItemCount[cat.id] ? ` (${categoryItemCount[cat.id]})` : ''}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── MENU ITEMS ── */}
      <main style={{ background: 'var(--cream)', padding: 'clamp(1.5rem, 4vw, 3rem) clamp(1rem, 5vw, 2.5rem) clamp(2rem, 5vw, 4rem)', flexShrink: 0 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>

          {/* Results counter */}
          {!loading && !error && (
            <p style={{ fontFamily: "'Lato',sans-serif", fontWeight: 700, fontSize: '0.8rem', color: 'var(--bark)', marginBottom: '1.25rem', letterSpacing: '0.04em' }}>
              {visibleItems.length === 0
                ? 'No dishes match your search'
                : activeCategory === 'ALL'
                  ? `${visibleItems.length} dish${visibleItems.length !== 1 ? 'es' : ''} available${search ? ` · "${search}"` : ''}`
                  : `${visibleItems.length} dish${visibleItems.length !== 1 ? 'es' : ''} in ${categories.find((c) => c.id === activeCategory)?.name ?? 'this category'}${search ? ` · "${search}"` : ''}`
              }
            </p>
          )}

          {/* Items */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: 'clamp(1rem, 2.5vw, 1.5rem)', marginBottom: 'clamp(3rem, 6vw, 5rem)' }}>
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 320 }} />)}
            </div>
          ) : error ? (
            <div style={{ borderRadius: 20, background: '#fff0ee', border: '1px solid rgba(181,69,27,0.2)', padding: '2rem', textAlign: 'center', fontFamily: "'Lato',sans-serif", fontSize: '0.9rem', color: 'var(--terracotta)', marginBottom: '2rem' }}>
              {error}
            </div>
          ) : groupedItems.length === 0 ? (
            <div style={{ borderRadius: 20, border: '1.5px dashed rgba(124,92,46,0.25)', background: '#fff', padding: '3rem', textAlign: 'center', fontFamily: "'Lato',sans-serif", fontSize: '0.9rem', color: 'var(--bark)', marginBottom: '2rem' }}>
              No dishes match your search.
            </div>
          ) : (
            <div style={{ marginBottom: 'clamp(3rem, 6vw, 5rem)' }}>
              {groupedItems.map(({ category, items: groupItems }, sectionIdx) => (
                <div key={category?.id ?? 'other'} className={`cat-row${sectionIdx % 2 === 1 ? ' zigzag' : ''}`}>
                  <div className="cat-side-header">
                    <span className="cat-side-num">{String(sectionIdx + 1).padStart(2, '0')}</span>
                    <h2 className="cat-side-name">{category?.name ?? 'Other'}</h2>
                    <span className="cat-side-count">{groupItems.length} dish{groupItems.length !== 1 ? 'es' : ''}</span>
                  </div>
                  <div className="cat-items-grid">
                    {groupItems.map((item) => (
                      <div key={item.id} className="menu-card">
                        {item.imageUrl ? (
                          <div style={{ position: 'relative', overflow: 'hidden' }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img className="menu-card-img" src={item.imageUrl} alt={item.name} loading="lazy" decoding="async" />
                          </div>
                        ) : (
                          <div className="menu-card-accent-bar" />
                        )}
                        <div style={{ padding: 'clamp(1rem, 2.5vw, 1.5rem)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          <h3 className="font-display" style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.35rem)', fontWeight: 700, color: 'var(--espresso)' }}>
                            {item.name}
                          </h3>
                          {item.description && (
                            <p className="menu-card-desc">
                              {item.description}
                            </p>
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                            <span style={{ fontFamily: "'Lato',sans-serif", fontWeight: 900, fontSize: '1.1rem', color: 'var(--terracotta)' }}>
                              {formatCurrency(Number(item.price))}
                            </span>
                            {(cart[item.id] ?? 0) === 0 ? (
                              <button
                                type="button"
                                className="add-btn"
                                onClick={() => setCart((prev) => ({ ...prev, [item.id]: 1 }))}
                              >
                                + Add
                              </button>
                            ) : (
                              <div className="qty-row">
                                <button
                                  type="button"
                                  className="qty-btn"
                                  aria-label="Remove one"
                                  onClick={() => setCart((prev) => {
                                    const n = (prev[item.id] ?? 1) - 1;
                                    if (n <= 0) { const next = { ...prev }; delete next[item.id]; return next; }
                                    return { ...prev, [item.id]: n };
                                  })}
                                >−</button>
                                <span className="qty-count">{cart[item.id]}</span>
                                <button
                                  type="button"
                                  className="qty-btn"
                                  aria-label="Add one more"
                                  onClick={() => setCart((prev) => ({ ...prev, [item.id]: (prev[item.id] ?? 0) + 1 }))}
                                >+</button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CTA banner */}
          <div style={{
            background: 'var(--espresso)', borderRadius: 24,
            padding: 'clamp(2rem, 5vw, 3.5rem) clamp(1.5rem, 4vw, 3rem)',
            textAlign: 'center',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #b5451b 0%, #d4a017 33%, #2d6a4f 66%, #b5451b 100%)' }} />
            <h2 className="font-display" style={{
              fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 900,
              color: '#fff', marginBottom: '0.75rem', lineHeight: 1.15,
            }}>
              Ready to Order?
            </h2>
            <p style={{
              fontFamily: "'Lato',sans-serif", fontWeight: 300,
              fontSize: '1rem', color: 'rgba(255,255,255,0.55)',
              marginBottom: '2rem', lineHeight: 1.6,
            }}>
              Call us or send a WhatsApp message — we&apos;ll take it from there.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="tel:0540951665" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'var(--terracotta)', color: '#fff',
                fontFamily: "'Lato',sans-serif", fontWeight: 700,
                fontSize: '0.9rem', padding: '0.875rem 1.75rem', borderRadius: 999,
                textDecoration: 'none',
              }}>
                <Phone size={16} /> Call Us
              </a>
              <a href={CONTACT_WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: '#25D366', color: '#fff',
                fontFamily: "'Lato',sans-serif", fontWeight: 700,
                fontSize: '0.9rem', padding: '0.875rem 1.75rem', borderRadius: 999,
                textDecoration: 'none',
              }}>
                <MessageCircle size={16} /> WhatsApp
              </a>
            </div>
          </div>

        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#0d0906' }}>
        <div style={{ height: 4, background: 'linear-gradient(90deg, #b5451b 0%, #d4a017 33%, #2d6a4f 66%, #b5451b 100%)' }} />
        <div style={{
          maxWidth: 700, margin: '0 auto', textAlign: 'center',
          padding: 'clamp(3rem, 6vw, 5rem) clamp(1rem, 5vw, 2.5rem)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem',
        }}>
          <span className="font-display" style={{ fontSize: '1.75rem', fontWeight: 900, fontStyle: 'italic', color: '#fff' }}>
            Crave <span style={{ color: 'var(--terracotta)', fontStyle: 'normal' }}>&</span> Co.
          </span>
          <p style={{ fontFamily: "'Lato',sans-serif", fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.75 }}>
            Soulful West African flavours in Ashongman Estate, Accra.<br />Mon – Sun · 8am – 10pm
          </p>
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/" style={{ fontFamily: "'Lato',sans-serif", fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>
              Home
            </Link>
            <Link href="/menu" style={{ fontFamily: "'Lato',sans-serif", fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>
              Our Menu
            </Link>
            <a href="tel:0540951665" style={{ fontFamily: "'Lato',sans-serif", fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>
              0540 951 665
            </a>
          </div>
          <p style={{ fontFamily: "'Lato',sans-serif", fontSize: '0.72rem', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.05em' }}>
            © {new Date().getFullYear()} Crave &amp; Co. · Accra, Ghana
          </p>
        </div>
      </footer>

      {!ECOMMERCE_ENABLED && orderModalOpen && (
        <ContactOrderModal onClose={() => setOrderModalOpen(false)} />
      )}

      {/* Floating generic CTA — only while cart is empty */}
      <div className={`menu-floating-cta${showFloatingCTA && cartItemCount === 0 ? ' visible' : ''}`} aria-hidden={!(showFloatingCTA && cartItemCount === 0)}>
        <a href={CONTACT_WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: '#25D366', color: '#fff',
          fontFamily: "'Lato',sans-serif", fontWeight: 700, fontSize: '0.9rem',
          padding: '0.875rem 1.75rem', borderRadius: 999, textDecoration: 'none',
          boxShadow: '0 4px 20px rgba(37,211,102,0.45)',
        }}>
          <MessageCircle size={18} /> Order on WhatsApp
        </a>
      </div>

      {/* Order tray — springs up when items are in cart */}
      <div className={`order-tray${cartItemCount > 0 ? ' visible' : ''}`} aria-hidden={cartItemCount === 0}>
        <div className="order-tray-inner" style={{
          background: 'var(--espresso)', borderRadius: 20,
          padding: '1rem 1.25rem',
          boxShadow: '0 8px 40px rgba(26,18,9,0.45), 0 2px 8px rgba(26,18,9,0.2)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          {/* Top row: count + total + WA button */}
          <div className="order-tray-row">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.2rem' }}>
                <span style={{
                  background: 'var(--terracotta)', color: '#fff',
                  borderRadius: 999, padding: '1px 9px', minWidth: 24, textAlign: 'center',
                  fontFamily: "'Lato',sans-serif", fontWeight: 700, fontSize: '12px',
                }}>{cartItemCount}</span>
                <span style={{
                  fontFamily: "'Lato',sans-serif", fontWeight: 700, fontSize: '0.72rem',
                  color: 'rgba(255,255,255,0.45)', letterSpacing: '0.12em', textTransform: 'uppercase',
                }}>item{cartItemCount !== 1 ? 's' : ''} selected</span>
              </div>
              <div className="font-display" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', lineHeight: 1 }}>
                {formatCurrency(cartTotal)}
              </div>
            </div>
            <a
              href={buildWhatsAppOrder()}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, flexShrink: 0,
                background: '#25D366', color: '#fff',
                fontFamily: "'Lato',sans-serif", fontWeight: 700, fontSize: '0.9rem',
                padding: '0.75rem 1.5rem', borderRadius: 12, textDecoration: 'none',
                boxShadow: '0 4px 16px rgba(37,211,102,0.4)', whiteSpace: 'nowrap',
                minHeight: 44,
              }}
            >
              <MessageCircle size={16} /> Order on WhatsApp
            </a>
          </div>

          {/* Delivery type toggle */}
          <div className="delivery-toggle">
            <button
              type="button"
              className={`delivery-btn${deliveryType === 'pickup' ? ' active' : ''}`}
              onClick={() => setDeliveryType('pickup')}
            >
              <Store size={14} /> Pickup
            </button>
            <button
              type="button"
              className={`delivery-btn delivery${deliveryType === 'delivery' ? ' active delivery' : ''}`}
              onClick={() => setDeliveryType('delivery')}
            >
              <Truck size={14} /> Delivery
            </button>
          </div>

          {/* Location field — slides in when delivery is selected */}
          <div className={`delivery-loc${deliveryType === 'delivery' ? ' open' : ''}`}>
            <div className="delivery-loc-wrap">
              <span className="delivery-loc-icon"><MapPin size={14} /></span>
              <input
                type="text"
                className="delivery-loc-input"
                placeholder="Your area or landmark (e.g. East Legon, Shell station)"
                value={deliveryLocation}
                onChange={(e) => setDeliveryLocation(e.target.value)}
                aria-label="Delivery location"
              />
            </div>
            <p style={{ fontFamily: "'Lato',sans-serif", fontSize: '0.7rem', color: 'rgba(255,255,255,0.28)', marginTop: '0.4rem', lineHeight: 1.4 }}>
              Delivery cost confirmed on WhatsApp before we leave.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
