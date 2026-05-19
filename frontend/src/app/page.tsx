'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin, Phone, Clock, ChevronDown, Menu, X, Star, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { API_BASE } from '@/lib/constants';

/* ─────────────────────────── Types ─────────────────────────── */


const reviews = [
  { name: 'Abena K.', text: 'The Banku & Tilapia is absolutely divine — crispy on the outside, perfectly spiced inside. I drive across town for this.', rating: 5 },
  { name: 'Chidi O.',  text: 'Best Jollof Rice in Accra, full stop. The assorted version with gizzard? Unmatched. Crave & Co. has earned a loyal customer for life.', rating: 5 },
  { name: 'Yaa M.',   text: 'Fufu & Groundnut soup that tastes exactly like Grandma\'s. The atmosphere is warm and the service always makes you feel seen.', rating: 5 },
];


/* ─────────────────────────── Helpers ───────────────────────── */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

/* ─────────────────────────── Components ────────────────────── */

function StarRow({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: n }).map((_, i) => (
        <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
      ))}
    </div>
  );
}

interface LiveMenuItem {
  id: string;
  name: string;
  description?: string | null;
  price: number | string;
  imageUrl?: string | null;
  available: boolean;
  category?: { id: string; name: string } | null;
}

function formatGHS(value: number) {
  return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', minimumFractionDigits: 2 }).format(value);
}

export default function Home() {
  const [navOpen, setNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [liveItems, setLiveItems] = useState<LiveMenuItem[] | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const galleryAnim = useInView();
  const orderAnim   = useInView();
  const menuAnim    = useInView();
  const reviewAnim  = useInView();
  const contactAnim = useInView();

  useEffect(() => {
    const base = API_BASE || (typeof window !== 'undefined' ? window.location.origin : '');
    fetch(`${base}/api/v1/public/menu/items?limit=100`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setLiveItems(Array.isArray(data) ? data.filter((i: LiveMenuItem) => i.available) : []))
      .catch(() => setLiveItems([]));
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = navOpen ? 'hidden' : '';
  }, [navOpen]);

  const navLinks = ['order', 'gallery', 'menu', 'reviews', 'contact'];

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setNavOpen(false);
    setActiveSection(id);
  };

  return (
    <>
      {/* ── Global styles injected inline for self-contained TSX ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=Lato:wght@300;400;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body {
          font-family: 'Lato', sans-serif;
          background: #fdf8f2;
          color: #1a1209;
          overflow-x: hidden;
        }

        :root {
          --terracotta: #b5451b;
          --terracotta-light: #e8704a;
          --cream: #fdf8f2;
          --warm-tan: #f5e9d6;
          --espresso: #1a1209;
          --bark: #7c5c2e;
          --sage: #2d6a4f;
          --gold: #d4a017;
        }

        .font-display { font-family: 'Playfair Display', serif; }

        /* Fade-in animation */
        .fade-up { opacity: 0; transform: translateY(32px); transition: opacity 0.75s ease, transform 0.75s ease; }
        .fade-up.visible { opacity: 1; transform: translateY(0); }
        .fade-up.delay-1 { transition-delay: 0.1s; }
        .fade-up.delay-2 { transition-delay: 0.2s; }
        .fade-up.delay-3 { transition-delay: 0.35s; }
        .fade-up.delay-4 { transition-delay: 0.5s; }

        /* Hero parallax shimmer */
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        .shimmer-text {
          background: linear-gradient(90deg, #fff 0%, #ffd99a 40%, #fff 60%, #ffd99a 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }

        /* Wavy divider */
        .wave { width: 100%; overflow: hidden; line-height: 0; }
        .wave svg { display: block; }

        /* Scroll indicator */
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(8px); }
        }
        .bounce { animation: bounce 1.6s ease-in-out infinite; }

        /* Nav drawer */
        .drawer-overlay {
          position: fixed; inset: 0; z-index: 9998;
          background: rgba(26,18,9,0.55); backdrop-filter: blur(4px);
          opacity: 0; pointer-events: none; transition: opacity 0.3s ease;
        }
        .drawer-overlay.open { opacity: 1; pointer-events: all; }
        .drawer {
          position: fixed; top: 0; right: 0; bottom: 0; z-index: 9999;
          width: min(320px, 85vw);
          background: var(--cream);
          transform: translateX(100%);
          transition: transform 0.35s cubic-bezier(0.4,0,0.2,1);
          display: flex; flex-direction: column;
          padding: 2rem 2rem 2rem;
          border-left: 2px solid var(--warm-tan);
        }
        .drawer.open { transform: translateX(0); }

        /* Card hover lift */
        .meal-card { transition: transform 0.4s ease, box-shadow 0.4s ease; }
        @media (hover: hover) and (pointer: fine) {
          .meal-card:hover { transform: translateY(-6px) scale(1.02); box-shadow: 0 20px 48px rgba(26,18,9,0.18); }
        }

        /* Menu item hover line */
        .menu-item-name { position: relative; display: inline-block; }
        .menu-item-name::after {
          content: ''; position: absolute; bottom: -1px; left: 0; right: 0;
          height: 1px; background: var(--terracotta);
          transform: scaleX(0); transform-origin: left;
          transition: transform 0.3s ease;
        }
        @media (hover: hover) { .menu-item:hover .menu-item-name::after { transform: scaleX(1); } }

        /* Decorative grain overlay */
        .grain::after {
          content: ''; position: absolute; inset: 0; pointer-events: none;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          background-repeat: repeat;
          opacity: 0.5;
        }

        /* Pattern BG */
        .pattern-bg {
          background-color: var(--warm-tan);
          background-image: radial-gradient(circle, rgba(181,69,27,0.08) 1px, transparent 1px);
          background-size: 28px 28px;
        }

        /* Pill tag */
        .meal-tag {
          font-family: 'Lato', sans-serif;
          font-size: 9px; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase;
          background: rgba(255,255,255,0.85);
          color: var(--espresso);
          padding: 3px 8px; border-radius: 999px;
          backdrop-filter: blur(6px);
        }

        /* CTA button */
        .btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          background: var(--terracotta); color: #fff;
          font-family: 'Lato', sans-serif; font-weight: 700;
          font-size: 0.875rem; letter-spacing: 0.04em;
          padding: 0.875rem 1.75rem; border-radius: 999px;
          border: none; cursor: pointer;
          transition: background 0.2s, transform 0.2s;
          text-decoration: none;
        }
        .btn-primary:hover { background: #c94e20; transform: translateY(-1px); }
        .btn-outline {
          display: inline-flex; align-items: center; gap: 8px;
          background: transparent; color: #fff;
          font-family: 'Lato', sans-serif; font-weight: 700;
          font-size: 0.875rem; letter-spacing: 0.04em;
          padding: 0.875rem 1.75rem; border-radius: 999px;
          border: 1.5px solid rgba(255,255,255,0.5); cursor: pointer;
          transition: background 0.2s, border-color 0.2s;
          text-decoration: none;
        }
        .btn-outline:hover { background: rgba(255,255,255,0.12); border-color: #fff; }

        /* Review card */
        .review-card {
          background: var(--cream);
          border: 1px solid rgba(124,92,46,0.15);
          border-radius: 20px;
          padding: 2rem;
          box-shadow: 0 4px 24px rgba(26,18,9,0.06);
          transition: box-shadow 0.3s ease, transform 0.3s ease;
        }
        @media (hover: hover) { .review-card:hover { box-shadow: 0 12px 40px rgba(181,69,27,0.12); transform: translateY(-4px); } }

        /* Section label pill */
        .section-pill {
          display: inline-block;
          font-family: 'Lato', sans-serif; font-weight: 700;
          font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase;
          color: var(--terracotta);
          background: rgba(181,69,27,0.1);
          padding: 5px 14px; border-radius: 999px;
          margin-bottom: 1rem;
        }

        /* Contact icon bubble */
        .icon-bubble {
          width: 52px; height: 52px; border-radius: 50%;
          background: rgba(181,69,27,0.12);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 0.75rem;
          transition: background 0.2s;
        }
        .icon-bubble:hover { background: rgba(181,69,27,0.22); }

        /* Gallery grid scroll snapping on mobile */
        .gallery-reel {
          display: flex;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          gap: 12px;
          padding-bottom: 8px;
          scrollbar-width: none;
        }
        .gallery-reel::-webkit-scrollbar { display: none; }
        .gallery-reel > * { flex-shrink: 0; scroll-snap-align: start; }
      `}</style>

      {/* ══════════════════════ NAV ══════════════════════ */}
      <nav
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
          height: 60,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 clamp(1rem, 5vw, 2.5rem)',
          /* Always solid once scrolled — never lets text blend with page content */
          background: scrolled
            ? 'rgba(253,248,242,0.97)'
            : 'linear-gradient(to bottom, rgba(10,6,2,0.55) 0%, rgba(10,6,2,0.0) 100%)',
          backdropFilter: scrolled ? 'blur(14px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(14px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(124,92,46,0.15)' : 'none',
          boxShadow: scrolled ? '0 2px 20px rgba(26,18,9,0.08)' : 'none',
          transition: 'background 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease',
        }}
      >
        {/* Logo */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <span className="font-display" style={{
            fontSize: '1.2rem', fontWeight: 900, fontStyle: 'italic',
            color: scrolled ? 'var(--espresso)' : '#fff',
            letterSpacing: '-0.01em',
            transition: 'color 0.4s',
          }}>
            Crave <span style={{ color: 'var(--terracotta)', fontStyle: 'normal' }}>&</span> Co.
          </span>
        </button>

        {/* Desktop links */}
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }} className="hidden-mobile">
          {navLinks.map((l) => (
            <button
              key={l}
              onClick={() => scrollTo(l)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: "'Lato', sans-serif", fontWeight: 700,
                fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase',
                color: scrolled ? (activeSection === l ? 'var(--terracotta)' : 'var(--espresso)') : '#fff',
                transition: 'color 0.3s',
              }}
            >
              {l.charAt(0).toUpperCase() + l.slice(1)}
            </button>
          ))}
          <a href="#contact" className="btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.78rem' }}>
            Reserve a Table
          </a>
          <Link
            href="/dashboard/login"
            style={{
              fontFamily: "'Lato', sans-serif", fontWeight: 700,
              fontSize: '0.78rem', letterSpacing: '0.06em', textTransform: 'uppercase',
              color: scrolled ? 'var(--espresso)' : '#fff',
              textDecoration: 'none', padding: '0.5rem 0.5rem',
              borderBottom: '1.5px solid transparent',
              transition: 'border-color 0.2s, color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--terracotta)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'transparent')}
          >
            My Account
          </Link>
        </div>

        {/* Hamburger */}
        <button
          onClick={() => setNavOpen(true)}
          aria-label="Open menu"
          aria-expanded={navOpen}
          style={{
            display: 'none', background: 'none', border: 'none', cursor: 'pointer',
            color: scrolled ? 'var(--espresso)' : '#fff',
          }}
          className="show-mobile"
        >
          <Menu size={26} />
        </button>
      </nav>

      {/* ══════════════════════ MOBILE DRAWER ══════════════════════ */}
      <div className={`drawer-overlay${navOpen ? ' open' : ''}`} onClick={() => setNavOpen(false)} />
      <div className={`drawer${navOpen ? ' open' : ''}`} role="dialog" aria-modal="true">
        <button
          onClick={() => setNavOpen(false)}
          style={{ alignSelf: 'flex-end', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--espresso)' }}
          aria-label="Close menu"
        >
          <X size={24} />
        </button>
        <span className="font-display" style={{ fontSize: '1.5rem', fontWeight: 900, fontStyle: 'italic', marginTop: '2rem', marginBottom: '2.5rem', color: 'var(--espresso)' }}>
          Crave <span style={{ color: 'var(--terracotta)' }}>&</span> Co.
        </span>
        {navLinks.map((l) => (
          <button
            key={l}
            onClick={() => scrollTo(l)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
              fontFamily: "'Lato', sans-serif", fontWeight: 700,
              fontSize: '1.25rem', letterSpacing: '0.04em',
              color: 'var(--espresso)', padding: '0.75rem 0',
              borderBottom: '1px solid rgba(124,92,46,0.12)',
            }}
          >
            {l.charAt(0).toUpperCase() + l.slice(1)}
          </button>
        ))}
        <a href="tel:+233000000000" className="btn-primary" style={{ marginTop: '2rem', justifyContent: 'center' }}>
          Call Us Now
        </a>
        <Link
          href="/dashboard/login"
          onClick={() => setNavOpen(false)}
          style={{
            marginTop: '0.75rem', textAlign: 'center',
            fontFamily: "'Lato', sans-serif", fontWeight: 700,
            fontSize: '0.95rem', letterSpacing: '0.04em',
            color: 'var(--espresso)', textDecoration: 'underline',
          }}
        >
          Sign in / Create account
        </Link>
      </div>

      {/* ══════════════════════ HERO ══════════════════════ */}
      <section
        ref={heroRef}
        style={{
          position: 'relative', minHeight: '100dvh',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
        }}
        className="grain"
      >
        {/* Background */}
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1664993101841-036f189719b6?fm=webp&q=85&w=1920&h=1080&auto=format&fit=crop"
            alt="Crave & Co. — Jollof Rice & Chicken"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            loading="eager"
            decoding="async"
          />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(160deg, rgba(26,18,9,0.3) 0%, rgba(26,18,9,0.6) 50%, rgba(26,18,9,0.85) 100%)',
          }} />
        </div>

        {/* Decorative kente-inspired stripe bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 4,
          background: 'linear-gradient(90deg, var(--terracotta) 25%, var(--gold) 50%, var(--sage) 75%, var(--terracotta) 100%)',
        }} />

        {/* Content */}
        <div style={{
          position: 'relative', zIndex: 1,
          textAlign: 'center', padding: 'clamp(5rem, 10vw, 8rem) clamp(1rem, 5vw, 3rem) 4rem',
          maxWidth: 760, margin: '0 auto',
        }}>
          <span style={{
            display: 'inline-block', marginBottom: '1.25rem',
            fontFamily: "'Lato', sans-serif", fontWeight: 700,
            fontSize: '0.7rem', letterSpacing: '0.35em', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.7)',
            border: '1px solid rgba(255,255,255,0.25)', borderRadius: 999,
            padding: '5px 16px',
          }}>
            Accra · Ghana · Est. 2021
          </span>

          <h1 className="font-display shimmer-text" style={{
            fontSize: 'clamp(3rem, 10vw, 7rem)',
            fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.02em',
            marginBottom: '1.25rem',
          }}>
            Crave &amp; Co.
          </h1>

          <p style={{
            fontFamily: "'Lato', sans-serif", fontWeight: 300,
            fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
            color: 'rgba(255,255,255,0.75)', lineHeight: 1.7,
            maxWidth: 440, margin: '0 auto 2.5rem',
          }}>
            Soulful West African flavours, made fresh every single day. Come taste what home feels like.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => scrollTo('gallery')} className="btn-outline">
              Our Meals
            </button>
            <a href="/dashboard" className="btn-primary">
              Order Now <ArrowRight size={16} />
            </a>
          </div>

          {/* Floating stats */}
          <div style={{
            display: 'flex', gap: '2rem', justifyContent: 'center',
            marginTop: '3.5rem', flexWrap: 'wrap',
          }}>
            {[['500+', 'Happy Meals Daily'], ['9', 'Menu Sections'], ['Mon–Sun', 'Open All Week']].map(([val, label]) => (
              <div key={val} style={{ textAlign: 'center' }}>
                <div className="font-display" style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>{val}</div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="bounce" style={{ position: 'absolute', bottom: '2.5rem', left: '50%', transform: 'translateX(-50%)', color: 'rgba(255,255,255,0.5)' }}>
          <ChevronDown size={28} />
        </div>
      </section>

      {/* ══════════════════════ INTRO STRIP ══════════════════════ */}
      <div style={{ background: 'var(--terracotta)', padding: 'clamp(1.25rem,3vw,1.75rem) clamp(1rem,5vw,2rem)' }}>
        <p className="font-display" style={{
          color: '#fff', textAlign: 'center', fontStyle: 'italic',
          fontSize: 'clamp(1.1rem,2.5vw,1.5rem)', fontWeight: 400, letterSpacing: '0.01em',
        }}>
          "Every plate is a love letter to West Africa"
        </p>
      </div>

      {/* ══════════════════════ GALLERY ══════════════════════ */}
      <section id="gallery" style={{ padding: 'clamp(4rem,8vw,7rem) 0', background: 'var(--cream)' }}>
        <div ref={galleryAnim.ref} className={`fade-up${galleryAnim.visible ? ' visible' : ''}`}
          style={{ maxWidth: 1200, margin: '0 auto', padding: '0 clamp(1rem,5vw,2.5rem)' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span className="section-pill">Our Meals</span>
            <h2 className="font-display" style={{
              fontSize: 'clamp(2rem,5vw,3.25rem)', fontWeight: 900, lineHeight: 1.1,
              color: 'var(--espresso)', letterSpacing: '-0.02em',
            }}>
              Made Fresh,<br />
              <span style={{ color: 'var(--terracotta)', fontStyle: 'italic' }}>Every Single Day</span>
            </h2>
          </div>

          {/* Live meals grid */}
          {liveItems === null ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(220px,100%), 1fr))',
              gap: 'clamp(12px,2vw,20px)',
            }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{
                  aspectRatio: i === 0 ? '4/3' : '3/4',
                  gridColumn: i === 0 ? 'span 2' : 'span 1',
                  borderRadius: 20,
                  background: 'rgba(245,233,214,0.6)',
                  animation: 'pulse 1.4s ease-in-out infinite',
                }} />
              ))}
            </div>
          ) : liveItems.filter(i => i.imageUrl).length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(220px,100%), 1fr))',
              gap: 'clamp(12px,2vw,20px)',
            }}>
              {liveItems.filter(i => i.imageUrl).slice(0, 5).map((item, i) => (
                <a
                  key={item.id}
                  href="/dashboard"
                  className={`meal-card fade-up${galleryAnim.visible ? ' visible' : ''} delay-${Math.min(i + 1, 4)}`}
                  style={{
                    position: 'relative',
                    aspectRatio: i === 0 ? '4/3' : '3/4',
                    gridColumn: i === 0 ? 'span 2' : 'span 1',
                    borderRadius: 20, overflow: 'hidden',
                    background: '#e8d5bb',
                    cursor: 'pointer',
                    display: 'block',
                    textDecoration: 'none',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.imageUrl!}
                    alt={item.name}
                    loading="lazy"
                    decoding="async"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', position: 'absolute', inset: 0, transition: 'transform 0.6s ease' }}
                  />
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to top, rgba(26,18,9,0.72) 0%, transparent 55%)',
                  }} />
                  {item.category && (
                    <span className="meal-tag" style={{ position: 'absolute', top: 12, left: 12 }}>{item.category.name}</span>
                  )}
                  <div style={{ position: 'absolute', bottom: 14, left: 14, right: 14 }}>
                    <p className="font-display" style={{ color: '#fff', fontWeight: 700, fontSize: '1.05rem', lineHeight: 1.2 }}>{item.name}</p>
                    <p style={{ color: 'rgba(255,255,255,0.75)', fontFamily: "'Lato',sans-serif", fontSize: '0.8rem', marginTop: 3 }}>{formatGHS(Number(item.price))}</p>
                  </div>
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* ══════════════════════ WAVY DIVIDER ══════════════════════ */}
      <div className="wave" style={{ background: 'var(--cream)', marginBottom: -2 }}>
        <svg viewBox="0 0 1200 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,40 C200,80 400,0 600,40 C800,80 1000,0 1200,40 L1200,80 L0,80 Z"
            fill="#f5e9d6" />
        </svg>
      </div>

      {/* ══════════════════════ ORDER ONLINE (LIVE) ══════════════════════ */}
      <section
        id="order"
        style={{
          background: 'var(--cream)',
          padding: 'clamp(4rem,8vw,7rem) clamp(1rem,5vw,2.5rem)',
        }}
      >
        <div
          ref={orderAnim.ref}
          className={`fade-up${orderAnim.visible ? ' visible' : ''}`}
          style={{ maxWidth: 1180, margin: '0 auto' }}
        >
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span className="section-pill">Order Online</span>
            <h2
              className="font-display"
              style={{
                fontSize: 'clamp(2rem,5vw,3.25rem)', fontWeight: 900, lineHeight: 1.1,
                color: 'var(--espresso)', letterSpacing: '-0.02em',
              }}
            >
              Fresh today, in your hands minutes from now.
            </h2>
            <p style={{ color: 'var(--bark)', fontFamily: "'Lato',sans-serif", marginTop: '0.75rem', fontSize: '0.95rem' }}>
              Tap any dish to start your order. Pay securely with Paystack and track your order in real time.
            </p>
          </div>

          {liveItems === null ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(260px,100%), 1fr))',
                gap: '1.25rem',
              }}
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    height: 300,
                    borderRadius: 20,
                    background: 'rgba(245,233,214,0.6)',
                    animation: 'pulse 1.4s ease-in-out infinite',
                  }}
                />
              ))}
            </div>
          ) : liveItems.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                background: 'var(--warm-tan)',
                borderRadius: 20,
                padding: '2.5rem 1.5rem',
                color: 'var(--bark)',
                fontFamily: "'Lato',sans-serif",
              }}
            >
              <p style={{ marginBottom: '1rem' }}>Today&apos;s online menu is loading. Try our full menu below, or jump straight into the ordering app.</p>
              <Link href="/dashboard" className="btn-primary" style={{ display: 'inline-flex' }}>
                Open the order app <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(min(260px,100%), 1fr))',
                  gap: '1.25rem',
                }}
              >
                {liveItems.slice(0, 8).map((item) => (
                  <Link
                    key={item.id}
                    href="/dashboard"
                    style={{
                      display: 'flex', flexDirection: 'column',
                      background: '#fff',
                      borderRadius: 20,
                      overflow: 'hidden',
                      border: '1px solid rgba(124,92,46,0.12)',
                      boxShadow: '0 4px 18px rgba(26,18,9,0.05)',
                      textDecoration: 'none',
                      color: 'inherit',
                      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    }}
                    className="meal-card"
                  >
                    <div
                      style={{
                        position: 'relative',
                        aspectRatio: '4/3',
                        background: 'var(--warm-tan)',
                        overflow: 'hidden',
                      }}
                    >
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          loading="lazy"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            height: '100%',
                            color: 'var(--bark)',
                            fontFamily: "'Lato',sans-serif",
                            fontSize: '0.75rem',
                            letterSpacing: '0.2em', textTransform: 'uppercase',
                          }}
                        >
                          Crave Classic
                        </div>
                      )}
                      {item.category?.name && (
                        <span
                          style={{
                            position: 'absolute', top: 12, left: 12,
                            background: 'rgba(26,18,9,0.65)',
                            color: '#fff', fontSize: 10, fontWeight: 700,
                            letterSpacing: '0.15em', textTransform: 'uppercase',
                            padding: '4px 10px', borderRadius: 999,
                            backdropFilter: 'blur(6px)',
                            fontFamily: "'Lato',sans-serif",
                          }}
                        >
                          {item.category.name}
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        padding: '1rem 1.1rem 1.25rem',
                        display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1,
                      }}
                    >
                      <h3
                        style={{
                          fontFamily: "'Lato',sans-serif",
                          fontWeight: 700,
                          fontSize: '1rem',
                          color: 'var(--espresso)',
                          lineHeight: 1.3,
                        }}
                      >
                        {item.name}
                      </h3>
                      {item.description && (
                        <p
                          style={{
                            fontFamily: "'Lato',sans-serif",
                            fontSize: '0.8rem',
                            color: 'var(--bark)',
                            lineHeight: 1.5,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {item.description}
                        </p>
                      )}
                      <div
                        style={{
                          marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          paddingTop: '0.5rem',
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "'Lato',sans-serif", fontWeight: 700,
                            fontSize: '1rem', color: 'var(--espresso)',
                          }}
                        >
                          {formatGHS(Number(item.price))}
                        </span>
                        <span
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            background: 'var(--terracotta)',
                            color: '#fff',
                            fontFamily: "'Lato',sans-serif", fontWeight: 700,
                            fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
                            padding: '6px 12px', borderRadius: 999,
                          }}
                        >
                          Order <ArrowRight size={12} />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
                <Link href="/dashboard" className="btn-primary" style={{ display: 'inline-flex' }}>
                  Browse full menu & order <ArrowRight size={16} />
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ══════════════════════ MENU ══════════════════════ */}
      <section id="menu" style={{ background: 'var(--warm-tan)', padding: 'clamp(4rem,8vw,7rem) clamp(1rem,5vw,2.5rem)' }} className="pattern-bg">
        <div ref={menuAnim.ref} className={`fade-up${menuAnim.visible ? ' visible' : ''}`}
          style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <span className="section-pill">The Menu</span>
            <h2 className="font-display" style={{
              fontSize: 'clamp(2rem,5vw,3.25rem)', fontWeight: 900, lineHeight: 1.1,
              color: 'var(--espresso)', letterSpacing: '-0.02em',
            }}>
              Our Full Menu
            </h2>
            <p style={{ color: 'var(--bark)', fontFamily: "'Lato',sans-serif", marginTop: '0.75rem', fontSize: '0.95rem' }}>
              Freshly prepared each morning. No compromises, ever.
            </p>
          </div>

          {liveItems === null ? (
            /* Skeletons while loading */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{
                  height: 140, borderRadius: 18,
                  background: 'rgba(245,233,214,0.5)',
                  animation: 'pulse 1.4s ease-in-out infinite',
                  animationDelay: `${i * 0.15}s`,
                }} />
              ))}
            </div>
          ) : liveItems.length === 0 ? (
            <div style={{
              textAlign: 'center', background: 'rgba(253,248,242,0.85)',
              borderRadius: 18, padding: '2.5rem 1.5rem',
              color: 'var(--bark)', fontFamily: "'Lato',sans-serif",
            }}>
              <p>Menu is being updated. Check back shortly or order directly in the app.</p>
              <Link href="/dashboard" className="btn-primary" style={{ display: 'inline-flex', marginTop: '1rem' }}>
                Open the order app <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
              {Object.entries(
                liveItems.reduce<Record<string, LiveMenuItem[]>>((acc, item) => {
                  const cat = item.category?.name ?? 'Other';
                  if (!acc[cat]) acc[cat] = [];
                  acc[cat].push(item);
                  return acc;
                }, {})
              ).map(([category, items], si) => (
                <div
                  key={category}
                  className={`fade-up${menuAnim.visible ? ' visible' : ''}`}
                  style={{
                    background: 'rgba(253,248,242,0.88)',
                    borderRadius: 18,
                    padding: 'clamp(1.25rem,3vw,2rem)',
                    border: '1px solid rgba(124,92,46,0.12)',
                    backdropFilter: 'blur(8px)',
                    transitionDelay: `${si * 0.06}s`,
                  }}
                >
                  {/* Category header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <h3 className="font-display" style={{
                      fontSize: '1.15rem', fontWeight: 700, fontStyle: 'italic',
                      color: 'var(--terracotta)', whiteSpace: 'nowrap',
                    }}>{category}</h3>
                    <div style={{ flex: 1, height: 1, background: 'rgba(181,69,27,0.2)' }} />
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px,100%), 1fr))',
                    gap: '0.85rem 2.5rem',
                  }}>
                    {items.map((item) => (
                      <Link
                        key={item.id}
                        href="/dashboard"
                        style={{ textDecoration: 'none', display: 'block' }}
                      >
                        <div
                          className="menu-item"
                          style={{
                            paddingBottom: '0.5rem',
                            borderBottom: '1px solid rgba(124,92,46,0.08)',
                            cursor: 'pointer',
                            transition: 'opacity 0.15s',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                            <span style={{
                              fontFamily: "'Lato',sans-serif", fontWeight: 700,
                              fontSize: '0.9rem', color: 'var(--espresso)', flex: 1,
                            }}>{item.name}</span>
                            <span style={{
                              fontFamily: "'Lato',sans-serif", fontWeight: 700,
                              fontSize: '0.85rem', color: 'var(--terracotta)',
                              whiteSpace: 'nowrap', flexShrink: 0,
                            }}>{formatGHS(Number(item.price))}</span>
                          </div>
                          {item.description && (
                            <p style={{
                              fontFamily: "'Lato',sans-serif", fontSize: '0.78rem',
                              color: 'var(--bark)', marginTop: 2, lineHeight: 1.5,
                            }}>{item.description}</p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <Link href="/dashboard" className="btn-primary" style={{ display: 'inline-flex' }}>
              Order now <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════ REVIEWS ══════════════════════ */}
      <section id="reviews" style={{ background: 'var(--cream)', padding: 'clamp(4rem,8vw,7rem) clamp(1rem,5vw,2.5rem)' }}>
        <div ref={reviewAnim.ref} className={`fade-up${reviewAnim.visible ? ' visible' : ''}`}
          style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span className="section-pill">Guest Love</span>
            <h2 className="font-display" style={{
              fontSize: 'clamp(2rem,5vw,3.25rem)', fontWeight: 900, lineHeight: 1.1,
              color: 'var(--espresso)', letterSpacing: '-0.02em',
            }}>
              What Our Guests Say
            </h2>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px,100%), 1fr))',
            gap: 'clamp(1rem,2vw,1.5rem)',
          }}>
            {reviews.map((r, i) => (
              <div
                key={r.name}
                className={`review-card fade-up${reviewAnim.visible ? ' visible' : ''} delay-${i + 1}`}
              >
                <StarRow n={r.rating} />
                <p className="font-display" style={{
                  fontSize: '1.05rem', fontStyle: 'italic', lineHeight: 1.65,
                  color: 'var(--espresso)', margin: '1rem 0 1.25rem',
                }}>
                  &ldquo;{r.text}&rdquo;
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--terracotta), var(--gold))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 700, fontSize: '0.85rem',
                    fontFamily: "'Lato',sans-serif",
                  }}>
                    {r.name.charAt(0)}
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '0.875rem', fontFamily: "'Lato',sans-serif", color: 'var(--espresso)' }}>
                    {r.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════ CONTACT ══════════════════════ */}
      <section id="contact" style={{ background: 'var(--espresso)', position: 'relative', overflow: 'hidden' }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', border: '1px solid rgba(181,69,27,0.2)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 240, height: 240, borderRadius: '50%', border: '1px solid rgba(212,160,23,0.15)', pointerEvents: 'none' }} />

        <div
          ref={contactAnim.ref}
          className={`fade-up${contactAnim.visible ? ' visible' : ''}`}
          style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(4rem,8vw,7rem) clamp(1rem,5vw,2.5rem)', position: 'relative', zIndex: 1 }}
        >
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <span style={{
              display: 'inline-block',
              fontFamily: "'Lato',sans-serif", fontWeight: 700,
              fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase',
              color: 'var(--terracotta)',
              background: 'rgba(181,69,27,0.15)',
              padding: '5px 14px', borderRadius: 999, marginBottom: '1rem',
            }}>Find Us</span>
            <h2 className="font-display" style={{
              fontSize: 'clamp(2rem,5vw,3.25rem)', fontWeight: 900, lineHeight: 1.1,
              color: '#fff', letterSpacing: '-0.02em',
            }}>
              Come Dine With Us
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontFamily: "'Lato',sans-serif", marginTop: '0.75rem' }}>
              We'd love to have you at our table.
            </p>
          </div>

          {/* Info cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(220px,100%), 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
            {[
              { icon: <MapPin size={22} style={{ color: 'var(--terracotta)' }} />, label: 'Location', val: 'Accra, Ghana', sub: 'Find us on Google Maps' },
              { icon: <Phone size={22} style={{ color: 'var(--terracotta)' }} />, label: 'Call Us', val: '+233 000 000 000', sub: 'Available during hours' },
              { icon: <Clock size={22} style={{ color: 'var(--terracotta)' }} />, label: 'Hours', val: 'Mon – Sun', sub: '8:00 AM – 10:00 PM' },
            ].map(({ icon, label, val, sub }) => (
              <div key={label} style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 16, padding: '1.75rem 1.5rem',
                textAlign: 'center',
                transition: 'background 0.2s',
              }}>
                <div className="icon-bubble">{icon}</div>
                <p style={{ fontFamily: "'Lato',sans-serif", fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: '0.5rem' }}>{label}</p>
                <p style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: '1.1rem', color: '#fff', marginBottom: '0.25rem' }}>{val}</p>
                <p style={{ fontFamily: "'Lato',sans-serif", fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>{sub}</p>
              </div>
            ))}
          </div>

          {/* CTA row */}
          <div style={{ textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '2.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
            <a href="tel:+233000000000" className="btn-primary">
              <Phone size={16} /> Call to Reserve
            </a>
            <a href="#menu" className="btn-outline" onClick={(e) => { e.preventDefault(); scrollTo('menu'); }}>
              Browse Full Menu
            </a>
          </div>
        </div>
      </section>

      {/* ══════════════════════ FOOTER ══════════════════════ */}
      <footer style={{
        background: '#0d0906',
        padding: 'clamp(1.25rem,3vw,2rem) clamp(1rem,5vw,2.5rem)',
        display: 'flex', flexWrap: 'wrap', gap: '0.75rem',
        alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span className="font-display" style={{ fontStyle: 'italic', fontWeight: 700, color: 'rgba(255,255,255,0.3)', fontSize: '0.95rem' }}>
          Crave <span style={{ color: 'var(--terracotta)' }}>&</span> Co.
        </span>
        <p style={{ fontFamily: "'Lato',sans-serif", fontSize: '0.75rem', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.05em' }}>
          © 2026 Crave & Co. Restaurant · Accra, Ghana · All rights reserved.
        </p>
        <p style={{ fontFamily: "'Lato',sans-serif", fontSize: '0.7rem', color: 'rgba(255,255,255,0.15)' }}>
          Food photography by{' '}
          <a href="https://unsplash.com/@keeshasskitchen" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.25)', textDecoration: 'underline' }}>Keesha's Kitchen</a>
          {' '}via Unsplash
        </p>
      </footer>

      {/* Inline CSS for show/hide on mobile */}
      <style>{`
        .hidden-mobile { display: flex; }
        .show-mobile   { display: none; }
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .show-mobile   { display: flex !important; }
        }
      `}</style>
    </>
  );
}