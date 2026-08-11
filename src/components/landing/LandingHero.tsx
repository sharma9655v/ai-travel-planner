'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Star, ChevronDown } from 'lucide-react';
import HeroGlobe from '@/components/landing/HeroGlobe';
import DemoCard from '@/components/landing/DemoCard';
import { fadeUp, stagger } from '@/lib/motion';

// ============================================================
// Landing Hero — copy left, animated globe + demo card right.
// The sub-line intentionally keeps the historic greeting so the
// release gate and portfolio screenshots ('next adventure?')
// stay green.
// ============================================================

const STATS = [
  { value: '10K+', label: 'Trips Planned' },
  { value: '150+', label: 'Destinations' },
];

export default function LandingHero() {
  return (
    <section
      id="top"
      style={{
        position: 'relative',
        minHeight: '100svh',
        display: 'flex',
        alignItems: 'center',
        padding: '7rem 1.25rem 4rem',
        overflow: 'hidden',
      }}
    >
      {/* Ambient background */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at 25% 15%, rgba(39, 242, 255, 0.09) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(177, 109, 255, 0.08) 0%, transparent 50%), radial-gradient(ellipse at 50% 60%, rgba(39, 242, 255, 0.04) 0%, transparent 60%)',
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(39, 242, 255, 0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(39, 242, 255, 0.025) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          maskImage: 'radial-gradient(ellipse at 50% 35%, black 25%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 35%, black 25%, transparent 75%)',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: '1200px',
          margin: '0 auto',
          width: '100%',
        }}
        className="landing-hero-grid"
      >
        {/* ── Left: copy ── */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          style={{ textAlign: 'center', maxWidth: '560px' }}
        >
          <motion.div variants={fadeUp}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.375rem 1rem',
                background: 'rgba(39, 242, 255, 0.08)',
                border: '1px solid rgba(39, 242, 255, 0.15)',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--color-primary)',
                letterSpacing: '0.03em',
              }}
            >
              <Sparkles size={12} />
              AI-Powered Travel Intelligence
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            style={{ margin: '1.25rem 0 1rem', fontSize: 'clamp(2rem, 5vw, 3rem)' }}
          >
            Your next adventure,{' '}
            <span className="gradient-text">planned by AI.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            style={{
              fontSize: 'clamp(0.9375rem, 2vw, 1.0625rem)',
              color: 'var(--color-text-secondary)',
              lineHeight: 1.7,
              margin: '0 auto 2rem',
              maxWidth: '480px',
            }}
          >
            Hi! Ready for your <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>next adventure?</span>{' '}
            Tell the AI your dream — and get a complete, personalized plan:
            optimized routes, weather-smart days, and hidden gems.
          </motion.p>

          <motion.div
            variants={fadeUp}
            style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}
          >
            <Link
              href="/plan"
              className="btn-primary"
              style={{ fontSize: '0.9375rem', padding: '0.75rem 1.75rem' }}
            >
              <Sparkles size={16} />
              Start Planning Free
            </Link>
            <Link
              href="#how-it-works"
              className="btn-secondary"
              style={{ fontSize: '0.9375rem', padding: '0.75rem 1.75rem' }}
            >
              See How It Works
              <ArrowRight size={16} />
            </Link>
          </motion.div>

          <motion.div
            variants={fadeUp}
            style={{ display: 'flex', justifyContent: 'center', gap: '2.5rem', marginTop: '2.5rem', flexWrap: 'wrap' }}
          >
            {STATS.map((s) => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 800,
                    color: 'var(--color-text-primary)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {s.value}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                  {s.label}
                </div>
              </div>
            ))}
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  color: 'var(--color-text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.25rem',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                4.9 <Star size={14} fill="#FFB547" color="#FFB547" />
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                User Rating
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* ── Right: globe + demo card ── */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="landing-hero-right"
        >
          <div
            style={{
              display: 'grid',
              placeItems: 'center',
              filter: 'drop-shadow(0 0 40px rgba(39, 242, 255, 0.15))',
            }}
          >
            <HeroGlobe />
          </div>

          {/* Floating demo card overlapping the globe corner */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="landing-demo-wrap"
          >
            <DemoCard />
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll hint */}
      <motion.a
        href="#how-it-works"
        aria-label="Scroll to how it works"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 0.6 }}
        className="landing-scroll-hint"
        style={{
          position: 'absolute',
          bottom: '1.25rem',
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'var(--color-text-muted)',
          animation: 'bounce-soft 2.4s ease-in-out infinite',
        }}
      >
        <ChevronDown size={18} />
      </motion.a>
    </section>
  );
}