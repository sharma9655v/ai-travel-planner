'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plane } from 'lucide-react';

export default function Navbar() {
  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        padding: '0 1.25rem',
        background: 'rgba(9, 11, 16, 0.7)',
        backdropFilter: 'blur(24px) saturate(150%)',
        WebkitBackdropFilter: 'blur(24px) saturate(150%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '56px',
        }}
      >
        {/* Left — placeholder anchor for symmetric layout */}
        <div style={{ width: 36 }} aria-hidden="true" />

        {/* Center — Title */}
        <Link
          href="/"
          style={{
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'opacity 200ms',
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(135deg, #27F2FF 0%, #B16DFF 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 12px rgba(39, 242, 255, 0.3)',
            }}
          >
            <Plane size={14} color="#090B10" style={{ transform: 'rotate(-45deg)' }} />
          </div>
          <span
            style={{
              fontSize: '0.875rem',
              fontWeight: 800,
              color: 'var(--color-text-primary)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            AI Travel Planner
          </span>
        </Link>

        {/* Right — Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Link
            href="/profile"
            aria-label="Your profile"
            title="Your profile"
            style={{ textDecoration: 'none', display: 'block' }}
          >
            <motion.div
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.95 }}
              style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-full)',
                background: 'linear-gradient(135deg, #27F2FF, #B16DFF)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#090B10',
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(39, 242, 255, 0.25)',
              }}
            >
              U
            </motion.div>
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}
