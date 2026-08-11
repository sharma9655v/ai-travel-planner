'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Compass } from 'lucide-react';
import { fadeUp, scaleIn, stagger } from '@/lib/motion';

const STYLES = [
  { label: 'Adventure', emoji: '🧗' },
  { label: 'Culture', emoji: '🏛️' },
  { label: 'Beach', emoji: '🏖️' },
  { label: 'Foodie', emoji: '🍜' },
  { label: 'Solo', emoji: '🧳' },
  { label: 'Family', emoji: '👨‍👩‍👧‍👦' },
  { label: 'Luxury', emoji: '💎' },
  { label: 'Budget', emoji: '🎒' },
];

export default function TravelStyles() {
  return (
    <section className="landing-section" style={{ paddingTop: '2rem' }}>
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        variants={stagger}
        style={{ textAlign: 'center' }}
      >
        <motion.div variants={fadeUp}>
          <span className="landing-kicker" style={{ color: 'var(--color-primary)', background: 'var(--color-primary-muted)', borderColor: 'rgba(39,242,255,0.2)' }}>
            <Compass size={12} />
            Travel styles
          </span>
        </motion.div>
        <motion.h2 variants={fadeUp} style={{ margin: '0.875rem 0 1.5rem' }}>
          Can&apos;t decide? Pick a vibe
        </motion.h2>
        <motion.div
          variants={stagger}
          style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0.625rem', maxWidth: '720px', margin: '0 auto' }}
        >
          {STYLES.map((s) => (
            <motion.div key={s.label} variants={scaleIn}>
              <Link
                href="/plan"
                className="card-interactive"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 1.125rem',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                  textDecoration: 'none',
                }}
              >
                <span style={{ fontSize: '1rem' }}>{s.emoji}</span>
                {s.label}
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}