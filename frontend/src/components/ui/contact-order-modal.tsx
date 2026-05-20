'use client';

import { Phone, X, MessageCircle } from 'lucide-react';

// ── Contact details ─────────────────────────────────────────────────
// TODO: Replace with real numbers before going live
export const CONTACT_PHONE = '0540951665';
const CONTACT_WHATSAPP_NUM = '233540951665';
export const CONTACT_WHATSAPP_LINK = `https://wa.me/${CONTACT_WHATSAPP_NUM}?text=${encodeURIComponent(
  "Hi! I'd like to place an order from Crave & Co. 🍽️",
)}`;

interface Props {
  onClose: () => void;
}

export function ContactOrderModal({ onClose }: Props) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="order-modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'rgba(26,18,9,0.75)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(1rem, 5vw, 2rem)',
      }}
    >
      <style>{`
        .order-modal-backdrop { display: flex; }
        @media (max-width: 540px) {
          .order-modal-backdrop { align-items: flex-end !important; padding: 0 !important; }
          .order-modal-card {
            border-radius: 24px 24px 0 0 !important;
            max-width: 100% !important;
            width: 100% !important;
            padding-bottom: calc(2rem + env(safe-area-inset-bottom)) !important;
          }
        }
      `}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        className="order-modal-card"
        style={{
          background: '#fdf8f2',
          borderRadius: 28,
          maxWidth: 460,
          width: '100%',
          padding: 'clamp(2rem, 5vw, 2.75rem)',
          position: 'relative',
          boxShadow: '0 32px 80px rgba(26,18,9,0.45)',
          border: '1px solid rgba(181,69,27,0.12)',
        }}
      >
        {/* Kente accent stripe */}
        <div
          style={{
            height: 4,
            borderRadius: 999,
            background:
              'linear-gradient(90deg, #b5451b 0%, #d4a017 33%, #2d6a4f 66%, #b5451b 100%)',
            marginBottom: '1.75rem',
          }}
        />

        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            background: 'rgba(124,92,46,0.1)',
            border: 'none',
            cursor: 'pointer',
            width: 32,
            height: 32,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#7c5c2e',
          }}
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <p
            style={{
              fontFamily: "'Lato', sans-serif",
              fontWeight: 700,
              fontSize: 10,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#b5451b',
              marginBottom: '0.5rem',
            }}
          >
            Ready to Order?
          </p>
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(1.5rem, 5vw, 1.9rem)',
              fontWeight: 900,
              color: '#1a1209',
              lineHeight: 1.2,
              marginBottom: '0.75rem',
            }}
          >
            Pick Your Dishes
          </h2>
          <p
            style={{
              fontFamily: "'Lato', sans-serif",
              fontSize: '0.875rem',
              color: '#7c5c2e',
              lineHeight: 1.65,
              maxWidth: 340,
              margin: '0 auto',
            }}
          >
            Browse the menu, tap{' '}
            <strong style={{ color: '#1a1209' }}>+ Add</strong>
            {' '}on your favourites, then send your full cart to WhatsApp in one tap — or call us directly.
          </p>
        </div>

        {/* CTA buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <a
            href="/menu"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.625rem',
              background: '#1a1209',
              color: '#fff',
              fontFamily: "'Lato', sans-serif",
              fontWeight: 700,
              fontSize: '0.95rem',
              padding: '0.9rem 1.5rem',
              borderRadius: 999,
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(26,18,9,0.2)',
              transition: 'background 0.2s, transform 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#2d1f10';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#1a1209';
              e.currentTarget.style.transform = 'none';
            }}
          >
            Browse Menu &amp; Build Your Order →
          </a>
          <a
            href={CONTACT_WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.625rem',
              background: '#25D366',
              color: '#fff',
              fontFamily: "'Lato', sans-serif",
              fontWeight: 700,
              fontSize: '0.95rem',
              padding: '0.9rem 1.5rem',
              borderRadius: 999,
              textDecoration: 'none',
              boxShadow: '0 4px 16px rgba(37,211,102,0.3)',
              transition: 'background 0.2s, transform 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#1fb857';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#25D366';
              e.currentTarget.style.transform = 'none';
            }}
          >
            <MessageCircle size={20} />
            Order via WhatsApp
          </a>
          <a
            href={`tel:${CONTACT_PHONE}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.625rem',
              background: '#1a1209',
              color: '#fff',
              fontFamily: "'Lato', sans-serif",
              fontWeight: 700,
              fontSize: '0.95rem',
              padding: '0.9rem 1.5rem',
              borderRadius: 999,
              textDecoration: 'none',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#3a1f17';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#1a1209';
            }}
          >
            <Phone size={20} />
            Call Us &middot; {CONTACT_PHONE}
          </a>
        </div>

        {/* Coming-soon note */}
        <div
          style={{
            background: 'rgba(212,160,23,0.08)',
            border: '1px solid rgba(212,160,23,0.25)',
            borderRadius: 14,
            padding: '0.875rem 1rem',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontFamily: "'Lato', sans-serif",
              fontSize: '0.78rem',
              color: '#7c5c2e',
              lineHeight: 1.55,
            }}
          >
            �{' '}
            <strong style={{ color: '#1a1209' }}>No account needed.</strong>{' '}
            Your cart is pre-formatted and sent as a WhatsApp message — we&apos;ll confirm and have it ready for you.
          </p>
        </div>
      </div>
    </div>
  );
}
