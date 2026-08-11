'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plane } from 'lucide-react';

const LINKS = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Features', href: '#features' },
  { label: 'Destinations', href: '#destinations' },
];

export default function LandingNavbar() {
  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: 'rgba(9, 11, 16, 0.72)',
        backdropFilter: 'blur(24px) saturate(150%)',
        WebkitBackdropFilter: 'blur(24px) saturate(150%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '64px',
          gap: '1rem',
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          aria-label="AI Travel Planner home"
          style={{
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(135deg, #27F2FF 0%, #B16DFF 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 12px rgba(39, 242, 255, 0.3)',
            }}
          >
            <Plane size={15} color="#090B10" style={{ transform: 'rotate(-45deg)' }} />
          </div>
          <span
            style={{
              fontSize: '0.9375rem',
              fontWeight: 800,
              color: 'var(--color-text-primary)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            AI Travel Planner
          </span>
        </Link>

        {/* Center links (desktop) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.75rem',
            margin: '0 auto',
          }}
        >
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              style={{
                textDecoration: 'none',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: 'var(--color-text-secondary)',
                transition: 'color 200ms',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text-primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexShrink: 0 }}>
          <Link
            href="/profile"
            className="btn-ghost"
            style={{ fontSize: '0.8125rem', padding: '0.5rem 1rem' }}
          >
            Log in
          </Link>
          <Link
            href="/plan"
            className="btn-primary"
            style={{ fontSize: '0.8125rem', padding: '0.5rem 1.125rem' }}
          >
            Plan My Trip
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}