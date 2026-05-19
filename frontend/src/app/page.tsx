'use client';

import { useState, useEffect } from 'react';
import { MapPin, Phone, Clock, Menu, X, MessageCircle, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { ECOMMERCE_ENABLED } from '@/lib/feature-flags';
import { ContactOrderModal, CONTACT_WHATSAPP_LINK } from '@/components/ui/contact-order-modal';

// TODO: Replace placeholder photos with your own restaurant shots for best results.
const SLIDES = [
  // {
  //   src: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?fm=webp&q=85&w=1920&h=1080&auto=format&fit=crop',
  //   alt: 'Fufu',
  //   caption: 'Fufu — hand-pounded to perfection, served with rich stew.',
  // },
  {
    src: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?fm=webp&q=85&w=1920&h=1080&auto=format&fit=crop',
    alt: 'Banku & Okro Stew',
    caption: 'Banku & Okro Stew — smooth, sour dough with thick flavourful okro.',
  },
  {
    src: 'https://images.unsplash.com/photo-1664993101841-036f189719b6?fm=webp&q=85&w=1920&h=1080&auto=format&fit=crop',
    alt: 'Jollof Rice',
    caption: 'Jollof Rice — Ghana\'s finest, cooked slow in tomato and spice.',
  },
  {
    src: 'https://images.unsplash.com/photo-1619557512034-b925c195e328?fm=webp&q=85&w=1920&h=1080&auto=format&fit=crop',
    alt: 'Fried Rice',
    caption: 'Fried Rice — tossed with fresh vegetables and seasoning.',
  },
  // {
  //   src: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?fm=webp&q=85&w=1920&h=1080&auto=format&fit=crop',
  //   alt: 'Plain Rice',
  //   caption: 'Plain Rice — fluffy and fresh, the perfect base for any stew.',
  // },
  

  // {
  //   src: 'https://images.unsplash.com/photo-1702647105022-124b48120582?fm=webp&q=85&w=1920&h=1080&auto=format&fit=crop',
  //   alt: 'Club Beer',
  //   caption: 'Club Beer — ice cold, the perfect Ghanaian mealtime companion.',
  // },
  {
    src: 'https://images.unsplash.com/photo-1764032757567-231d0e210201?fm=webp&q=85&w=1920&h=1080&auto=format&fit=crop',
    alt: 'Bottled Water',
    caption: 'Bottled Water — chilled and refreshing, always available.',
  },
];

export default function Home() {
  const [navOpen, setNavOpen] = useState(false);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [slideIdx, setSlideIdx] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = navOpen ? 'hidden' : '';
  }, [navOpen]);

  // Auto-advance every 5 s — always runs regardless of hover
  useEffect(() => {
    const id = setInterval(() => setSlideIdx((s) => (s + 1) % SLIDES.length), 5000);
    return () => clearInterval(id);
  }, []);

  const scrollToContact = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
    setNavOpen(false);
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

        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        .shimmer-text {
          background: linear-gradient(90deg, #fff 0%, #ffd99a 40%, #fff 60%, #ffd99a 100%);
          background-size: 200% auto;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .slide-caption { animation: fadeInUp 0.7s ease forwards; }

        .hero-arrow {
          position: absolute; top: 50%; transform: translateY(-50%);
          z-index: 2; width: 44px; height: 44px; border-radius: 50%;
          background: rgba(255,255,255,0.15); backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          border: 1px solid rgba(255,255,255,0.25);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: #fff; transition: background 0.2s;
        }
        .hero-arrow:hover { background: rgba(255,255,255,0.3); }
        .hero-arrow.prev { left: clamp(1rem, 3vw, 2rem); }
        .hero-arrow.next { right: clamp(1rem, 3vw, 2rem); }
        @media (max-width: 480px) {
          .hero-arrow { width: 36px; height: 36px; }
        }

        .hero-dot {
          height: 8px; border-radius: 999px;
          background: rgba(255,255,255,0.4); border: none;
          cursor: pointer; padding: 0; transition: all 0.4s ease;
        }
        .hero-dot.active { background: #fff; }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(1rem, 5vw, 2.5rem)',
        background: scrolled ? 'rgba(253,248,242,0.97)' : 'linear-gradient(to bottom, rgba(10,6,2,0.5) 0%, transparent 100%)',
        backdropFilter: scrolled ? 'blur(14px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(124,92,46,0.12)' : 'none',
        transition: 'background 0.35s, border-color 0.35s',
      }}>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <span className="font-display" style={{
            fontSize: '1.25rem', fontWeight: 900, fontStyle: 'italic',
            color: scrolled ? 'var(--espresso)' : '#fff',
            transition: 'color 0.3s',
          }}>
            Crave <span style={{ color: 'var(--terracotta)', fontStyle: 'normal' }}>&</span> Co.
          </span>
        </button>

        <div className="hidden-mobile" style={{ gap: '2rem', alignItems: 'center' }}>
          <Link href="/menu" style={{
            fontFamily: "'Lato',sans-serif", fontWeight: 700, fontSize: '0.8rem',
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: scrolled ? 'var(--espresso)' : '#fff', textDecoration: 'none',
            transition: 'color 0.3s',
          }}>
            Our Menu
          </Link>
          <button onClick={scrollToContact} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: "'Lato',sans-serif", fontWeight: 700, fontSize: '0.8rem',
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: scrolled ? 'var(--espresso)' : '#fff', transition: 'color 0.3s',
          }}>
            Find Us
          </button>
          {ECOMMERCE_ENABLED ? (
            <Link href="/dashboard" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'var(--terracotta)', color: '#fff',
              fontFamily: "'Lato',sans-serif", fontWeight: 700,
              fontSize: '0.8rem', letterSpacing: '0.06em',
              padding: '0.5rem 1.25rem', borderRadius: 999,
              textDecoration: 'none', transition: 'background 0.2s',
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
              transition: 'background 0.2s',
            }}>
              <MessageCircle size={14} /> Order on WhatsApp
            </button>
          )}
        </div>

        <button
          onClick={() => setNavOpen(true)}
          className="show-mobile"
          aria-label="Open menu"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: scrolled ? 'var(--espresso)' : '#fff' }}
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
        <Link href="/menu" onClick={() => setNavOpen(false)} style={{
          fontFamily: "'Lato',sans-serif", fontWeight: 700, fontSize: '1.1rem',
          color: 'var(--espresso)', textDecoration: 'none',
          padding: '0.75rem 0', borderBottom: '1px solid rgba(124,92,46,0.12)',
        }}>
          Our Menu
        </Link>
        <button onClick={scrollToContact} style={{
          background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
          fontFamily: "'Lato',sans-serif", fontWeight: 700, fontSize: '1.1rem',
          color: 'var(--espresso)', padding: '0.75rem 0',
          borderBottom: '1px solid rgba(124,92,46,0.12)',
        }}>
          Find Us
        </button>
        <a href="tel:0540951665" style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          marginTop: '2rem', background: 'var(--terracotta)', color: '#fff',
          fontFamily: "'Lato',sans-serif", fontWeight: 700, fontSize: '0.9rem',
          padding: '0.875rem 1.5rem', borderRadius: 999, textDecoration: 'none',
        }}>
          <Phone size={16} /> Call Us
        </a>
      </div>

      {/* ── HERO CAROUSEL ── */}
      <section
        style={{ position: 'relative', minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
      >
        {/* Slides — crossfade */}
        {SLIDES.map((s, i) => (
          <div
            key={i}
            style={{ position: 'absolute', inset: 0, opacity: i === slideIdx ? 1 : 0, transition: 'opacity 1.2s ease', zIndex: 0 }}
            aria-hidden={i !== slideIdx}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={s.src}
              alt={s.alt}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              loading={i === 0 ? 'eager' : 'lazy'}
              decoding="async"
            />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,6,2,0.52)' }} />
          </div>
        ))}

        {/* Kente stripe */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #b5451b 0%, #d4a017 33%, #2d6a4f 66%, #b5451b 100%)', zIndex: 3 }} />

        {/* Content */}
        <div style={{
          position: 'relative', zIndex: 1, textAlign: 'center',
          padding: 'clamp(5rem,10vw,8rem) clamp(1rem,5vw,3rem) 5rem',
          maxWidth: 680, margin: '0 auto',
        }}>
          <p style={{
            fontFamily: "'Lato',sans-serif", fontWeight: 700, fontSize: '0.7rem',
            letterSpacing: '0.35em', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.65)', marginBottom: '1.5rem',
            border: '1px solid rgba(255,255,255,0.2)', borderRadius: 999,
            display: 'inline-block', padding: '5px 16px',
          }}>
            Accra · Ghana · Est. 2021
          </p>
          <h1 className="font-display shimmer-text" style={{
            fontSize: 'clamp(3rem,10vw,7rem)', fontWeight: 900,
            lineHeight: 1.05, letterSpacing: '-0.02em', marginBottom: '1.25rem',
          }}>
            Crave &amp; Co.
          </h1>
          {/* Caption fades in on each slide change */}
          <p key={slideIdx} className="slide-caption" style={{
            fontFamily: "'Lato',sans-serif", fontWeight: 300,
            fontSize: 'clamp(1rem,2.5vw,1.2rem)',
            color: 'rgba(255,255,255,0.78)', lineHeight: 1.7,
            maxWidth: 420, margin: '0 auto 2.5rem',
          }}>
            {/* {SLIDES[slideIdx].caption} */}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/menu" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'var(--terracotta)', color: '#fff',
              fontFamily: "'Lato',sans-serif", fontWeight: 700,
              fontSize: '0.9rem', letterSpacing: '0.04em',
              padding: '0.875rem 1.75rem', borderRadius: 999,
              textDecoration: 'none', transition: 'background 0.2s',
            }}>
              Browse Menu <ArrowRight size={16} />
            </Link>
            {!ECOMMERCE_ENABLED && (
              <button type="button" onClick={() => setOrderModalOpen(true)} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'transparent', color: '#fff',
                border: '1.5px solid rgba(255,255,255,0.45)',
                fontFamily: "'Lato',sans-serif", fontWeight: 700,
                fontSize: '0.9rem', letterSpacing: '0.04em',
                padding: '0.875rem 1.75rem', borderRadius: 999,
                cursor: 'pointer', transition: 'background 0.2s',
              }}>
                <MessageCircle size={16} /> How to Order
              </button>
            )}
          </div>
        </div>

        {/* Prev / Next arrows */}
        <button
          className="hero-arrow prev"
          onClick={() => setSlideIdx((s) => (s - 1 + SLIDES.length) % SLIDES.length)}
          aria-label="Previous slide"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          className="hero-arrow next"
          onClick={() => setSlideIdx((s) => (s + 1) % SLIDES.length)}
          aria-label="Next slide"
        >
          <ChevronRight size={20} />
        </button>

        {/* Dot indicators */}
        <div style={{
          position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
          zIndex: 2, display: 'flex', gap: '0.5rem', alignItems: 'center',
        }}>
          {SLIDES.map((_, i) => (
            <button
              key={i}
              className={`hero-dot${i === slideIdx ? ' active' : ''}`}
              style={{ width: i === slideIdx ? 24 : 8 }}
              onClick={() => setSlideIdx(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" style={{ background: 'var(--cream)' }}>
        {/* Kente stripe */}
        <div style={{ height: 6, background: 'linear-gradient(90deg, #b5451b 0%, #d4a017 25%, #2d6a4f 50%, #d4a017 75%, #b5451b 100%)' }} />

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(4rem,8vw,7rem) clamp(1rem,5vw,2.5rem)' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <span style={{
              display: 'inline-block', fontFamily: "'Lato',sans-serif", fontWeight: 700,
              fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase',
              color: 'var(--terracotta)', background: 'rgba(181,69,27,0.1)',
              padding: '5px 14px', borderRadius: 999, marginBottom: '1rem',
            }}>
              Find Us
            </span>
            <h2 className="font-display" style={{
              fontSize: 'clamp(2rem,5vw,3.25rem)', fontWeight: 900, lineHeight: 1.1,
              color: 'var(--espresso)', letterSpacing: '-0.02em',
            }}>
              Directions &amp; Contact
            </h2>
            <p style={{ color: 'var(--bark)', fontFamily: "'Lato',sans-serif", fontSize: '0.95rem', marginTop: '0.75rem' }}>
              Visit us in Ashongman Estate — orders &amp; enquiries are by phone or WhatsApp only.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(360px,100%), 1fr))',
            gap: 'clamp(1.5rem,4vw,3rem)', alignItems: 'start',
          }}>
            {/* LEFT: contact cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {/* Address */}
              <a href="https://maps.app.goo.gl/5XryCD9avm3P9CzL9" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <div
                  style={{
                    background: 'var(--terracotta)', borderRadius: 20,
                    padding: 'clamp(1.5rem,3vw,2rem)',
                    display: 'flex', alignItems: 'center', gap: '1.25rem',
                    boxShadow: '0 6px 24px rgba(181,69,27,0.3)',
                    transition: 'transform 0.2s', cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'none'; }}
                >
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <MapPin size={24} style={{ color: '#fff' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: "'Lato',sans-serif", fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.65)', marginBottom: '0.3rem' }}>Our Address</p>
                    <p className="font-display" style={{ color: '#fff', fontWeight: 700, fontSize: '1.05rem', lineHeight: 1.3 }}>Atomic Hills Estate St,<br />Ashongman Estate, Accra</p>
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.85)', fontFamily: "'Lato',sans-serif", fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>Get Directions ↗</span>
                </div>
              </a>

              {/* Phone */}
              <a href="tel:0540951665" style={{ textDecoration: 'none' }}>
                <div
                  style={{
                    background: '#fff', border: '1px solid rgba(124,92,46,0.12)',
                    borderRadius: 20, padding: 'clamp(1.25rem,3vw,1.5rem)',
                    display: 'flex', alignItems: 'center', gap: '1.25rem',
                    boxShadow: '0 2px 12px rgba(26,18,9,0.06)',
                    transition: 'transform 0.2s', cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'none'; }}
                >
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(181,69,27,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Phone size={20} style={{ color: 'var(--terracotta)' }} />
                  </div>
                  <div>
                    <p style={{ fontFamily: "'Lato',sans-serif", fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--bark)', marginBottom: '0.2rem' }}>Call Us</p>
                    <p className="font-display" style={{ color: 'var(--espresso)', fontWeight: 700, fontSize: '1.15rem' }}>0540 951 665</p>
                  </div>
                </div>
              </a>

              {/* WhatsApp */}
              <a href={CONTACT_WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <div
                  style={{
                    background: '#fff', border: '1px solid rgba(37,211,102,0.2)',
                    borderRadius: 20, padding: 'clamp(1.25rem,3vw,1.5rem)',
                    display: 'flex', alignItems: 'center', gap: '1.25rem',
                    boxShadow: '0 2px 12px rgba(37,211,102,0.08)',
                    transition: 'transform 0.2s', cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'none'; }}
                >
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(37,211,102,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <MessageCircle size={20} style={{ color: '#25D366' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: "'Lato',sans-serif", fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--bark)', marginBottom: '0.2rem' }}>WhatsApp</p>
                    <p className="font-display" style={{ color: 'var(--espresso)', fontWeight: 700, fontSize: '1.05rem' }}>Message &amp; Order</p>
                  </div>
                  <span style={{ fontFamily: "'Lato',sans-serif", fontWeight: 700, fontSize: '0.8rem', color: '#25D366', flexShrink: 0 }}>Chat ↗</span>
                </div>
              </a>

              {/* Hours */}
              <div style={{
                background: '#fff', border: '1px solid rgba(124,92,46,0.12)',
                borderRadius: 20, padding: 'clamp(1.25rem,3vw,1.5rem)',
                display: 'flex', alignItems: 'center', gap: '1.25rem',
                boxShadow: '0 2px 12px rgba(26,18,9,0.06)',
              }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(181,69,27,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Clock size={20} style={{ color: 'var(--terracotta)' }} />
                </div>
                <div>
                  <p style={{ fontFamily: "'Lato',sans-serif", fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--bark)', marginBottom: '0.2rem' }}>Opening Hours</p>
                  <p className="font-display" style={{ color: 'var(--espresso)', fontWeight: 700, fontSize: '1.05rem' }}>Mon – Sun &middot; 8am – 10pm</p>
                </div>
              </div>
            </div>

            {/* RIGHT: map */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(124,92,46,0.15)', boxShadow: '0 4px 24px rgba(26,18,9,0.08)' }}>
                <iframe
                  title="Crave &amp; Co. Location"
                  src="https://maps.google.com/maps?q=Ashongman+Estate,+Accra,+Ghana&output=embed&z=15"
                  style={{ width: '100%', height: 460, border: 0, display: 'block' }}
                  loading="lazy"
                  allowFullScreen
                />
              </div>
              <a
                href="https://maps.app.goo.gl/5XryCD9avm3P9CzL9"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  background: 'var(--espresso)', color: '#fff',
                  fontFamily: "'Lato',sans-serif", fontWeight: 700, fontSize: '0.875rem',
                  padding: '0.875rem 1.5rem', borderRadius: 12,
                  textDecoration: 'none', transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#2d1f10'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--espresso)'; }}
              >
                <MapPin size={16} /> Open in Google Maps ↗
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#0d0906' }}>
        <div style={{ height: 4, background: 'linear-gradient(90deg, #b5451b 0%, #d4a017 33%, #2d6a4f 66%, #b5451b 100%)' }} />
        <div style={{
          maxWidth: 700, margin: '0 auto', textAlign: 'center',
          padding: 'clamp(3rem,6vw,5rem) clamp(1rem,5vw,2.5rem)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem',
        }}>
          <span className="font-display" style={{ fontSize: '1.75rem', fontWeight: 900, fontStyle: 'italic', color: '#fff' }}>
            Crave <span style={{ color: 'var(--terracotta)', fontStyle: 'normal' }}>&</span> Co.
          </span>
          <p style={{ fontFamily: "'Lato',sans-serif", fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.75 }}>
            Soulful West African flavours in Ashongman Estate, Accra.<br />Mon – Sun · 8am – 10pm
          </p>
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/menu" style={{ fontFamily: "'Lato',sans-serif", fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>
              Our Menu
            </Link>
            <button onClick={scrollToContact} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Lato',sans-serif", fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', padding: 0 }}>
              Find Us
            </button>
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
