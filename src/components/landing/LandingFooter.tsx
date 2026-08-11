'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plane, Sparkles, Map, MapPin } from 'lucide-react';

// ============================================================
// Final CTA + Footer. Only links to existing routes are used.
// ============================================================

export default function LandingFooter() {
  return (
    <>
      {/* ── Final CTA ── */}
      <section
        className="landing-section"
        style={{ paddingTop: '2rem', paddingBottom: '5.5rem' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="glass-card-static"
          style={{
            position: 'relative',
            overflow: 'hidden',
            textAlign: 'center',
            padding: '3.5rem 1.5rem',
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(ellipse at 20% 0%, rgba(39,242,255,0.12) 0%, transparent 55%), radial-gradient(ellipse at 85% 100%, rgba(177,109,255,0.12) 0%, transparent 55%)',
              pointerEvents: 'none',
            }}
          />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', marginBottom: '0.875rem' }}>
              Stop planning. <span className="gradient-text">Start exploring.</span>
            </h2>
            <p
              style={{
                color: 'var(--color-text-secondary)',
                maxWidth: '480px',
                margin: '0 auto 2rem',
                fontSize: '0.9375rem',
                lineHeight: 1.7,
              }}
            >
              Tell AI where you&apos;re headed — and see your perfect trip in minutes.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/plan" className="btn-primary" style={{ fontSize: '0.9375rem', padding: '0.75rem 1.75rem' }}>
                <Sparkles size={16} />
                Start Planning Free
              </Link>
              <Link href="/map" className="btn-secondary" style={{ fontSize: '0.9375rem', padding: '0.75rem 1.75rem' }}>
                <Map size={16} />
                Browse the Map
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          background: 'rgba(9, 11, 16, 0.6)',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '3rem 1.25rem 2rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '2rem',
          }}
        >
          {/* Brand */}
          <div>
            <Link
              href="/"
              style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 'var(--radius-sm)',
                  background: 'linear-gradient(135deg, #27F2FF, #B16DFF)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 12px rgba(39, 242, 255, 0.3)',
                }}
              >
                <Plane size={14} color="#090B10" style={{ transform: 'rotate(-45deg)' }} />
              </div>
              <span style={{ fontSize: '0.8125rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-primary)' }}>
                AI Travel Planner
              </span>
            </Link>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', maxWidth: '240px', lineHeight: 1.6 }}>
              Your next adventure, planned by AI — routes, weather and hidden gems in one plan.
            </p>
          </div>

          {/* Explore */}
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--color-text-primary)', marginBottom: '0.875rem' }}>
              Explore
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { label: 'How it works', href: '#how-it-works' },
                { label: 'Features', href: '#features' },
                { label: 'Destinations', href: '#destinations' },
                { label: 'Live Map', href: '/map' },
              ].map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  style={{ textDecoration: 'none', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Planner */}
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--color-text-primary)', marginBottom: '0.875rem' }}>
              Planner
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { label: 'Start Planning', href: '/plan' },
                { label: 'Quick Plan', href: '/quick-plan' },
                { label: 'My Trips', href: '/profile' },
              ].map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  style={{ textDecoration: 'none', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '1.25rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
            © 2026 AI Travel Planner. All rights reserved.
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
            <MapPin size={11} />
            Planned with AI, everywhere.
          </span>
        </div>
      </footer>
    </>
  );
}