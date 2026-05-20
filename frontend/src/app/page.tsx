'use client';

import { useState, useEffect } from 'react';
import { MapPin, Phone, Clock, Menu, X, MessageCircle, ArrowRight, ChevronLeft, ChevronRight, Utensils, Star, Zap, Truck, Users, Calendar } from 'lucide-react';
import Link from 'next/link';
import { ECOMMERCE_ENABLED } from '@/lib/feature-flags';
import { ContactOrderModal, CONTACT_WHATSAPP_LINK } from '@/components/ui/contact-order-modal';

const SLIDES = [
  {
    src: 'https://images.pexels.com/photos/5333327/pexels-photo-5333327.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
    alt: 'Ghanaian Jollof Rice',
    caption: "Jollof Rice \u2014 Ghana's finest, slow-cooked in rich tomato and spice.",
  },
  {
    src: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?fm=webp&q=85&w=1920&h=1080&auto=format&fit=crop',
    alt: 'Banku & Okro Stew',
    caption: 'Banku & Okro Stew \u2014 smooth, sour dough with thick flavourful okro.',
  },
  {
    src: 'https://images.pexels.com/photos/32612769/pexels-photo-32612769.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
    alt: 'Waakye',
    caption: 'Waakye \u2014 rice and beans with stew, gari, and shito. A true Ghanaian staple.',
  },
  {
    src: 'https://images.pexels.com/photos/35136066/pexels-photo-35136066.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
    alt: 'Kelewele',
    caption: 'Kelewele \u2014 spiced fried plantain with roasted groundnuts. The best Ghanaian snack.',
  },
  {
    src: 'https://images.pexels.com/photos/32612771/pexels-photo-32612771.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
    alt: 'Ghanaian Fried Rice',
    caption: 'Fried Rice \u2014 tossed with fresh vegetables, served with omelette and shito.',
  },
];

export default function Home() {
  const [navOpen, setNavOpen] = useState(false);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [slideIdx, setSlideIdx] = useState(0);
  const [showFloatingCTA, setShowFloatingCTA] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 60);
      setShowFloatingCTA(window.scrollY > window.innerHeight * 0.8);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('revealed'); io.unobserve(e.target); }
      }),
      { threshold: 0.12 }
    );
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    document.body.style.overflow = navOpen ? 'hidden' : '';
  }, [navOpen]);

  // Auto-advance every 5 s — always runs regardless of hover
  useEffect(() => {
    const id = setInterval(() => setSlideIdx((s) => (s + 1) % SLIDES.length), 5000);
    return () => clearInterval(id);
  }, []);

  const openNow = (() => {
    const h = new Date().getHours();
    if (h >= 8 && h < 22) return { open: true, label: 'Open Now · Closes 10pm' };
    if (h >= 22) return { open: false, label: 'Closed · Opens 8am' };
    return { open: false, label: 'Opens at 8am' };
  })();

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

        /* Scroll-reveal */
        .reveal { opacity: 0; transform: translateY(28px); transition: opacity 0.7s ease, transform 0.7s ease; }
        .reveal.revealed { opacity: 1; transform: none; }
        .reveal-d1 { transition-delay: 0.1s; }
        .reveal-d2 { transition-delay: 0.2s; }
        .reveal-d3 { transition-delay: 0.3s; }

        /* Feature cards */
        .feat-card {
          background: #fff; border-radius: 24px;
          padding: clamp(1.5rem, 3vw, 2.5rem);
          border: 1px solid rgba(124,92,46,0.1);
          box-shadow: 0 2px 20px rgba(26,18,9,0.05);
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .feat-card:hover { transform: translateY(-5px); box-shadow: 0 12px 40px rgba(26,18,9,0.1); }

        /* Step cards */
        .step-card {
          text-align: center; padding: clamp(2rem, 3vw, 3rem);
          border: 1px solid rgba(255,255,255,0.12); border-radius: 24px;
          background: rgba(255,255,255,0.06);
          transition: background 0.25s ease, border-color 0.25s ease;
          flex: 1 1 240px; max-width: 300px;
        }
        .step-card:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.22); }
        .step-arrow { display: flex; align-items: center; padding-bottom: 5rem; flex-shrink: 0; }
        .step-cta {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 0.5rem 1.1rem; border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.22); color: #fff;
          font-family: 'Lato', sans-serif; font-weight: 700; font-size: 0.78rem;
          letter-spacing: 0.08em; text-transform: uppercase;
          text-decoration: none; background: none; cursor: pointer;
          transition: background 0.2s, border-color 0.2s;
        }
        .step-cta:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.4); }
        @media (max-width: 720px) { .step-arrow { display: none; } .step-card { max-width: 100%; } }

        /* Floating CTA */
        .floating-cta {
          position: fixed; bottom: 1.75rem; left: 50%; z-index: 999;
          transform: translateX(-50%) translateY(80px);
          opacity: 0; pointer-events: none;
          transition: transform 0.45s cubic-bezier(0.34,1.56,0.64,1), opacity 0.35s ease;
        }
        .floating-cta.visible { transform: translateX(-50%) translateY(0); opacity: 1; pointer-events: all; }
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
          <a href="#catering" style={{
            fontFamily: "'Lato',sans-serif", fontWeight: 700, fontSize: '0.8rem',
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: scrolled ? 'var(--espresso)' : '#fff', textDecoration: 'none',
            transition: 'color 0.3s',
          }}>
            Catering
          </a>
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
        <a href="#catering" onClick={() => setNavOpen(false)} style={{
          fontFamily: "'Lato',sans-serif", fontWeight: 700, fontSize: '1.1rem',
          color: 'var(--espresso)', textDecoration: 'none',
          padding: '0.75rem 0', borderBottom: '1px solid rgba(124,92,46,0.12)',
          display: 'block',
        }}>
          Catering
        </a>
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
            Accra · Ghana · Est. 2026
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
              <a href="#how-it-works" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'transparent', color: '#fff',
                border: '1.5px solid rgba(255,255,255,0.45)',
                fontFamily: "'Lato',sans-serif", fontWeight: 700,
                fontSize: '0.9rem', letterSpacing: '0.04em',
                padding: '0.875rem 1.75rem', borderRadius: 999,
                cursor: 'pointer', transition: 'background 0.2s',
                textDecoration: 'none',
              }}>
                How It Works <ArrowRight size={16} />
              </a>
            )}
          </div>
          <p style={{
            fontFamily: "'Lato',sans-serif", fontWeight: 700, fontSize: '0.72rem',
            letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '1.75rem',
            color: openNow.open ? 'rgba(110,230,160,0.9)' : 'rgba(255,255,255,0.45)',
          }}>
            <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: openNow.open ? '#6ee6a0' : 'rgba(255,255,255,0.3)', marginRight: '0.4rem', verticalAlign: 'middle' }} />
            {openNow.label}
          </p>
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

      {/* ── WHY SECTION ── */}
      <section style={{ background: 'var(--cream)', padding: 'clamp(4rem,8vw,7rem) clamp(1rem,5vw,2.5rem)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <span style={{
              display: 'inline-block', fontFamily: "'Lato',sans-serif", fontWeight: 700,
              fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase',
              color: 'var(--terracotta)', background: 'rgba(181,69,27,0.1)',
              padding: '5px 14px', borderRadius: 999, marginBottom: '1rem',
            }}>
              Why Crave &amp; Co.
            </span>
            <h2 className="font-display" style={{
              fontSize: 'clamp(2rem,5vw,3.25rem)', fontWeight: 900, lineHeight: 1.1,
              color: 'var(--espresso)', letterSpacing: '-0.02em',
            }}>
              Bold Flavours. <em>Honest Food.</em>
            </h2>
            <p style={{ fontFamily: "'Lato',sans-serif", fontSize: '0.95rem', color: 'var(--bark)', marginTop: '0.75rem', maxWidth: 520, margin: '0.75rem auto 0' }}>
              Everything we serve is made from scratch, rooted in West African tradition and served with pride.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px,100%),1fr))', gap: '1.5rem' }}>
            <div className="feat-card">
              <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(181,69,27,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <Utensils size={24} style={{ color: 'var(--terracotta)' }} />
              </div>
              <h3 className="font-display" style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--espresso)', marginBottom: '0.5rem' }}>Freshly Made Every Day</h3>
              <p style={{ fontFamily: "'Lato',sans-serif", fontSize: '0.9rem', color: 'var(--bark)', lineHeight: 1.7 }}>
                No reheated food, no shortcuts. Every dish is prepared fresh each morning using quality ingredients.
              </p>
            </div>
            <div className="feat-card">
              <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(181,69,27,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <Star size={24} style={{ color: 'var(--terracotta)' }} />
              </div>
              <h3 className="font-display" style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--espresso)', marginBottom: '0.5rem' }}>Authentic Ghanaian Recipes</h3>
              <p style={{ fontFamily: "'Lato',sans-serif", fontSize: '0.9rem', color: 'var(--bark)', lineHeight: 1.7 }}>
                Bold spices, rich stews, and hearty portions rooted in the food culture of Accra and beyond.
              </p>
            </div>
            <div className="feat-card">
              <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(181,69,27,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <Zap size={24} style={{ color: 'var(--terracotta)' }} />
              </div>
              <h3 className="font-display" style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--espresso)', marginBottom: '0.5rem' }}>Order in Seconds</h3>
              <p style={{ fontFamily: "'Lato',sans-serif", fontSize: '0.9rem', color: 'var(--bark)', lineHeight: 1.7 }}>
                Pick your dishes, tap ‘+ Add’, then send your full cart to WhatsApp in one tap. No app, no sign-up.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ background: '#1a1209', padding: 'clamp(4rem,8vw,7rem) clamp(1rem,5vw,2.5rem)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <span style={{
              display: 'inline-block', fontFamily: "'Lato',sans-serif", fontWeight: 700,
              fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase',
              color: 'rgba(181,69,27,0.85)', background: 'rgba(181,69,27,0.15)',
              padding: '5px 14px', borderRadius: 999, marginBottom: '1rem',
            }}>
              How It Works
            </span>
            <h2 className="font-display" style={{
              fontSize: 'clamp(2rem,5vw,3.25rem)', fontWeight: 900, lineHeight: 1.1,
              color: '#fff', letterSpacing: '-0.02em',
            }}>
              From Browse to <em>Bite</em>
            </h2>
            <p style={{ fontFamily: "'Lato',sans-serif", fontSize: '0.95rem', color: 'rgba(255,255,255,0.45)', marginTop: '0.75rem', maxWidth: 480, margin: '0.75rem auto 0' }}>
              No apps, no sign-ups. Just great food, ordered on WhatsApp in seconds.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: 0, flexWrap: 'wrap' }}>

            {/* Step 1 */}
            <div className="step-card">
              <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(181,69,27,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                <Utensils size={24} style={{ color: '#b5451b' }} />
              </div>
              <p style={{ fontFamily: "'Lato',sans-serif", fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: '0.5rem' }}>Step 01</p>
              <h3 className="font-display" style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: '0.6rem' }}>Browse the Menu</h3>
              <p style={{ fontFamily: "'Lato',sans-serif", fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.75, marginBottom: '1.5rem' }}>
                Explore dishes grouped by category. Filter by type or search by name — from Jollof Rice to Banku &amp; Stew.
              </p>
              <Link href="/menu" className="step-cta">View Full Menu <ArrowRight size={13} /></Link>
            </div>

            {/* Arrow */}
            <div className="step-arrow">
              <ArrowRight size={22} color="rgba(255,255,255,0.2)" />
            </div>

            {/* Step 2 */}
            <div className="step-card">
              <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(181,69,27,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                <Zap size={24} style={{ color: '#b5451b' }} />
              </div>
              <p style={{ fontFamily: "'Lato',sans-serif", fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: '0.5rem' }}>Step 02</p>
              <h3 className="font-display" style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: '0.6rem' }}>Add to Your Order</h3>
              <p style={{ fontFamily: "'Lato',sans-serif", fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.75, marginBottom: '1.5rem' }}>
                Tap <strong style={{ color: 'rgba(255,255,255,0.75)' }}>+ Add</strong> on each dish. Your order tray builds automatically — adjust quantities and see your total live.
              </p>
              <Link href="/menu" className="step-cta">Build Your Order <ArrowRight size={13} /></Link>
            </div>

            {/* Arrow */}
            <div className="step-arrow">
              <ArrowRight size={22} color="rgba(255,255,255,0.2)" />
            </div>

            {/* Step 3 */}
            <div className="step-card">
              <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(181,69,27,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                <MessageCircle size={24} style={{ color: '#b5451b' }} />
              </div>
              <p style={{ fontFamily: "'Lato',sans-serif", fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: '0.5rem' }}>Step 03</p>
              <h3 className="font-display" style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: '0.6rem' }}>Send &amp; Enjoy</h3>
              <p style={{ fontFamily: "'Lato',sans-serif", fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.75, marginBottom: '1.5rem' }}>
                Hit &lsquo;Order on WhatsApp&rsquo; — your full cart arrives pre-formatted. Choose pickup from Ashongman Estate or delivery straight to you.
              </p>
              <button onClick={scrollToContact} className="step-cta">Get Directions <ArrowRight size={13} /></button>
            </div>

          </div>
        </div>
      </section>

      {/* ── DELIVERY APPS ── */}
      <section style={{ background: '#f0e8d8', padding: 'clamp(3rem,6vw,5rem) clamp(1rem,5vw,2.5rem)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <span style={{
            display: 'inline-block', fontFamily: "'Lato',sans-serif", fontWeight: 700,
            fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase',
            color: 'var(--terracotta)', background: 'rgba(181,69,27,0.1)',
            padding: '5px 14px', borderRadius: 999, marginBottom: '1rem',
          }}>
            Delivery
          </span>
          <h2 className="font-display" style={{
            fontSize: 'clamp(1.75rem,4vw,2.75rem)', fontWeight: 900, lineHeight: 1.15,
            color: 'var(--espresso)', letterSpacing: '-0.02em', marginBottom: '0.75rem',
          }}>
            Also on Your Favourite <em>Delivery Apps</em>
          </h2>
          <p style={{ fontFamily: "'Lato',sans-serif", fontSize: '0.95rem', color: 'var(--bark)', maxWidth: 460, margin: '0 auto 2.5rem' }}>
            Get Crave &amp; Co. delivered straight to your door via Bolt Food or Hubtel.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>

            {/* Bolt Food */}
            <a
              href="https://food.bolt.eu/en-US/137/p/188979"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none', flex: '1 1 260px', maxWidth: 360 }}
            >
              <div
                style={{
                  background: '#fff', borderRadius: 20, padding: '1.75rem 1.5rem',
                  border: '1px solid rgba(52,209,134,0.25)',
                  boxShadow: '0 4px 20px rgba(52,209,134,0.1)',
                  display: 'flex', alignItems: 'center', gap: '1.25rem',
                  transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer',
                }}
                onMouseEnter={(e) => { const d = e.currentTarget as HTMLDivElement; d.style.transform = 'translateY(-3px)'; d.style.boxShadow = '0 12px 36px rgba(52,209,134,0.2)'; }}
                onMouseLeave={(e) => { const d = e.currentTarget as HTMLDivElement; d.style.transform = 'none'; d.style.boxShadow = '0 4px 20px rgba(52,209,134,0.1)'; }}
              >
                <div style={{ width: 56, height: 56, borderRadius: 16, background: '#34d186', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Zap size={26} style={{ color: '#fff' }} />
                </div>
                <div style={{ textAlign: 'left', flex: 1 }}>
                  <p style={{ fontFamily: "'Lato',sans-serif", fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--bark)', marginBottom: '0.2rem' }}>Order Delivery</p>
                  <p className="font-display" style={{ color: 'var(--espresso)', fontWeight: 700, fontSize: '1.3rem', lineHeight: 1.2 }}>Bolt Food</p>
                  <p style={{ fontFamily: "'Lato',sans-serif", fontSize: '0.8rem', color: '#34d186', fontWeight: 700, marginTop: '0.25rem' }}>Order now ↗</p>
                </div>
              </div>
            </a>

            {/* Hubtel */}
            <a
              href="https://hubtel.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none', flex: '1 1 260px', maxWidth: 360 }}
            >
              <div
                style={{
                  background: '#fff', borderRadius: 20, padding: '1.75rem 1.5rem',
                  border: '1px solid rgba(255,107,53,0.2)',
                  boxShadow: '0 4px 20px rgba(255,107,53,0.08)',
                  display: 'flex', alignItems: 'center', gap: '1.25rem',
                  transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer',
                }}
                onMouseEnter={(e) => { const d = e.currentTarget as HTMLDivElement; d.style.transform = 'translateY(-3px)'; d.style.boxShadow = '0 12px 36px rgba(255,107,53,0.18)'; }}
                onMouseLeave={(e) => { const d = e.currentTarget as HTMLDivElement; d.style.transform = 'none'; d.style.boxShadow = '0 4px 20px rgba(255,107,53,0.08)'; }}
              >
                <div style={{ width: 56, height: 56, borderRadius: 16, background: '#ff6b35', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Truck size={26} style={{ color: '#fff' }} />
                </div>
                <div style={{ textAlign: 'left', flex: 1 }}>
                  <p style={{ fontFamily: "'Lato',sans-serif", fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--bark)', marginBottom: '0.2rem' }}>Order Delivery</p>
                  <p className="font-display" style={{ color: 'var(--espresso)', fontWeight: 700, fontSize: '1.3rem', lineHeight: 1.2 }}>Hubtel</p>
                  <p style={{ fontFamily: "'Lato',sans-serif", fontSize: '0.8rem', color: '#ff6b35', fontWeight: 700, marginTop: '0.25rem' }}>Search &ldquo;Crave Co&rdquo; ↗</p>
                </div>
              </div>
            </a>

          </div>
        </div>
      </section>

      {/* ── CATERING ── */}
      <section id="catering" style={{ background: '#1a0e06', padding: 'clamp(4rem,8vw,7rem) clamp(1rem,5vw,2.5rem)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <span style={{
              display: 'inline-block', fontFamily: "'Lato',sans-serif", fontWeight: 700,
              fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase',
              color: 'rgba(212,160,23,0.9)', background: 'rgba(212,160,23,0.12)',
              padding: '5px 14px', borderRadius: 999, marginBottom: '1rem',
            }}>
              Catering &amp; Events
            </span>
            <h2 className="font-display" style={{
              fontSize: 'clamp(2rem,5vw,3.25rem)', fontWeight: 900, lineHeight: 1.1,
              color: '#fff', letterSpacing: '-0.02em', marginBottom: '0.75rem',
            }}>
              We Come to <em>Your Event</em>
            </h2>
            <p style={{ fontFamily: "'Lato',sans-serif", fontSize: '0.95rem', color: 'rgba(255,255,255,0.5)', maxWidth: 520, margin: '0 auto 0' }}>
              Authentic Ghanaian cuisine served fresh at your event — birthday parties, corporate lunches, weddings, and everything in between.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px,100%),1fr))', gap: '1.25rem', marginBottom: '3rem' }}>
            {[
              { icon: <Calendar size={22} style={{ color: '#d4a017' }} />, title: 'Birthdays &amp; Parties', body: 'Let us handle the food so you can focus on the celebration. From jollof to desserts.' },
              { icon: <Users size={22} style={{ color: '#d4a017' }} />, title: 'Corporate Events', body: 'Impress colleagues and clients with a spread of bold West African flavours.' },
              { icon: <Star size={22} style={{ color: '#d4a017' }} />, title: 'Weddings &amp; Durbars', body: 'Traditional ceremonies, receptions, and outdoor durbars done the Ghanaian way.' },
              { icon: <Utensils size={22} style={{ color: '#d4a017' }} />, title: 'Buffet-Style Serving', body: 'Hot, fresh buffet lines with full setup — soups, stews, rice dishes, and more.' },
            ].map((item, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.05)', borderRadius: 20,
                padding: 'clamp(1.25rem,2.5vw,1.75rem)',
                border: '1px solid rgba(212,160,23,0.15)',
                transition: 'background 0.25s, border-color 0.25s',
              }}
              onMouseEnter={(e) => { const d = e.currentTarget as HTMLDivElement; d.style.background = 'rgba(255,255,255,0.08)'; d.style.borderColor = 'rgba(212,160,23,0.35)'; }}
              onMouseLeave={(e) => { const d = e.currentTarget as HTMLDivElement; d.style.background = 'rgba(255,255,255,0.05)'; d.style.borderColor = 'rgba(212,160,23,0.15)'; }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(212,160,23,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                  {item.icon}
                </div>
                <h3 className="font-display" style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }} dangerouslySetInnerHTML={{ __html: item.title }} />
                <p style={{ fontFamily: "'Lato',sans-serif", fontSize: '0.875rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>{item.body}</p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: "'Lato',sans-serif", fontSize: '0.9rem', color: 'rgba(255,255,255,0.4)', marginBottom: '1.5rem' }}>
              Tell us your headcount, date, and preferred dishes — we&rsquo;ll handle the rest.
            </p>
            <a
              href={`https://wa.me/233540951665?text=${encodeURIComponent("Hi! I'd like to enquire about catering for an event. Could you share your catering packages? 🍽️")}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: '#d4a017', color: '#1a0e06',
                fontFamily: "'Lato',sans-serif", fontWeight: 700,
                fontSize: '0.9rem', letterSpacing: '0.04em',
                padding: '0.9rem 2rem', borderRadius: 999,
                textDecoration: 'none', transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#e6b31a'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#d4a017'; }}
            >
              <MessageCircle size={17} /> Get a Catering Quote
            </a>
          </div>
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

      {/* ── FLOATING CTA ── */}
      {!ECOMMERCE_ENABLED && (
        <div className={`floating-cta${showFloatingCTA ? ' visible' : ''}`} aria-hidden={!showFloatingCTA}>
          <button
            type="button"
            onClick={() => setOrderModalOpen(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#25D366', color: '#fff', border: 'none', cursor: 'pointer',
              fontFamily: "'Lato',sans-serif", fontWeight: 700,
              fontSize: '0.9rem', letterSpacing: '0.04em',
              padding: '0.875rem 1.75rem', borderRadius: 999,
              boxShadow: '0 8px 32px rgba(37,211,102,0.4)',
              whiteSpace: 'nowrap',
            }}
          >
            <MessageCircle size={17} /> Order on WhatsApp
          </button>
        </div>
      )}
    </>
  );
}
