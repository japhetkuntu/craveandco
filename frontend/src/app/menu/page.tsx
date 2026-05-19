'use client';

import { useState, useEffect, useMemo } from 'react';
import { Phone, Menu, X, MessageCircle, ChevronLeft, Search } from 'lucide-react';
import Link from 'next/link';
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

  const visibleItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((item) => {
      if (!item.available) return false;
      if (activeCategory !== 'ALL' && item.category?.id !== activeCategory && item.categoryId !== activeCategory) return false;
      if (term && !item.name.toLowerCase().includes(term) && !(item.description ?? '').toLowerCase().includes(term)) return false;
      return true;
    });
  }, [items, activeCategory, search]);

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
        .menu-card-placeholder {
          width: 100%; height: 220px; display: flex;
          flex-direction: column; align-items: center; justify-content: center; gap: 0.5rem;
          background: linear-gradient(135deg, #1a1209 0%, #3d2510 55%, #1a1209 100%);
          position: relative; overflow: hidden;
        }
        .menu-card-placeholder::before {
          content: '';
          position: absolute; inset: 0;
          background: radial-gradient(ellipse at 50% 60%, rgba(181,69,27,0.22) 0%, transparent 68%);
        }
        .menu-card-initial {
          font-family: 'Playfair Display', serif; font-size: 5.5rem; font-weight: 900;
          font-style: italic; color: rgba(255,255,255,0.1); line-height: 1;
          position: relative; z-index: 1; user-select: none; pointer-events: none;
        }
        .menu-card-no-img-label {
          font-family: 'Lato', sans-serif; font-weight: 700; font-size: 10px;
          letter-spacing: 0.3em; text-transform: uppercase;
          color: rgba(255,255,255,0.28); position: relative; z-index: 1;
        }
        @media (max-width: 480px) {
          .menu-card-img, .menu-card-placeholder { height: 180px; }
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
          flex-shrink: 0; padding: 0.45rem 1rem; border-radius: 999px;
          font-family: 'Lato', sans-serif; font-weight: 700; font-size: 11px;
          letter-spacing: 0.15em; text-transform: uppercase; cursor: pointer;
          transition: all 0.2s; border: 1px solid rgba(124,92,46,0.25);
          background: #fff; color: var(--bark);
        }
        .filter-chip:hover { border-color: var(--terracotta); color: var(--terracotta); }
        .filter-chip.active { background: var(--espresso); color: #fff; border-color: var(--espresso); }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        .skeleton { animation: pulse 1.5s ease-in-out infinite; background: rgba(124,92,46,0.1); border-radius: 20px; }
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
        <h1 className="font-display" style={{
          fontSize: 'clamp(2.5rem, 7vw, 5rem)', fontWeight: 900,
          lineHeight: 1.05, letterSpacing: '-0.02em',
          color: '#fff', marginBottom: '0.75rem',
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
          <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginBottom: '2rem' }}>
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

      {/* ── MENU ITEMS ── */}
      <main style={{ background: 'var(--cream)', padding: 'clamp(2rem, 5vw, 4rem) clamp(1rem, 5vw, 2.5rem)', flexShrink: 0 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>

          {/* Search + filter */}
          <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
              <button type="button" className={`filter-chip${activeCategory === 'ALL' ? ' active' : ''}`} onClick={() => setActiveCategory('ALL')}>All</button>
              {categories.map((cat) => (
                <button key={cat.id} type="button" className={`filter-chip${activeCategory === cat.id ? ' active' : ''}`} onClick={() => setActiveCategory(cat.id)}>
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Items */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: 'clamp(1rem, 2.5vw, 1.5rem)', marginBottom: 'clamp(3rem, 6vw, 5rem)' }}>
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 320 }} />)}
            </div>
          ) : error ? (
            <div style={{ borderRadius: 20, background: '#fff0ee', border: '1px solid rgba(181,69,27,0.2)', padding: '2rem', textAlign: 'center', fontFamily: "'Lato',sans-serif", fontSize: '0.9rem', color: 'var(--terracotta)', marginBottom: '2rem' }}>
              {error}
            </div>
          ) : visibleItems.length === 0 ? (
            <div style={{ borderRadius: 20, border: '1.5px dashed rgba(124,92,46,0.25)', background: '#fff', padding: '3rem', textAlign: 'center', fontFamily: "'Lato',sans-serif", fontSize: '0.9rem', color: 'var(--bark)', marginBottom: '2rem' }}>
              No dishes match your search.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: 'clamp(1rem, 2.5vw, 1.5rem)', marginBottom: 'clamp(3rem, 6vw, 5rem)' }}>
              {visibleItems.map((item) => (
                <div key={item.id} className="menu-card">
                  <div style={{ position: 'relative', overflow: 'hidden' }}>
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="menu-card-img" src={item.imageUrl} alt={item.name} loading="lazy" decoding="async" />
                    ) : (
                      <div className="menu-card-placeholder">
                        <span className="menu-card-initial">{item.name.charAt(0)}</span>
                        <span className="menu-card-no-img-label">Crave &amp; Co.</span>
                      </div>
                    )}
                    {item.category?.name && (
                      <span style={{
                        position: 'absolute', top: '0.75rem', left: '0.75rem',
                        background: 'rgba(10,6,2,0.65)', backdropFilter: 'blur(4px)',
                        borderRadius: 999, padding: '3px 10px',
                        fontFamily: "'Lato',sans-serif", fontWeight: 700, fontSize: '10px',
                        letterSpacing: '0.15em', textTransform: 'uppercase', color: '#fff',
                      }}>
                        {item.category.name}
                      </span>
                    )}
                  </div>
                  <div style={{ padding: 'clamp(1rem, 2.5vw, 1.5rem)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <h3 className="font-display" style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.35rem)', fontWeight: 700, color: 'var(--espresso)' }}>
                      {item.name}
                    </h3>
                    {item.description && (
                      <p style={{ fontFamily: "'Lato',sans-serif", fontSize: '0.875rem', color: 'var(--bark)', lineHeight: 1.65 }}>
                        {item.description}
                      </p>
                    )}
                    <p style={{ fontFamily: "'Lato',sans-serif", fontWeight: 700, fontSize: '1.05rem', color: 'var(--espresso)', marginTop: '0.25rem' }}>
                      {formatCurrency(Number(item.price))}
                    </p>
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
    </>
  );
}
