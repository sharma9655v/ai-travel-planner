'use client';

import { motion } from 'framer-motion';
import { MessagesSquare, Sparkles, Map } from 'lucide-react';
import { fadeUp, scaleIn, stagger } from '@/lib/motion';

const STEPS = [
  {
    num: '01',
    icon: MessagesSquare,
    title: 'Tell AI your trip',
    text: 'Destination, dates, vibe and budget — describe it in plain words or pick a travel style. No forms marathon.',
    color: '#27F2FF',
  },
  {
    num: '02',
    icon: Sparkles,
    title: 'Watch it plan',
    text: 'AI builds your day-by-day itinerary: optimized routing, weather-smart timing, and budget-aware picks.',
    color: '#B16DFF',
  },
  {
    num: '03',
    icon: Map,
    title: 'Tweak and go',
    text: 'Refine anything in a live chat — swap days, add hidden gems, rework the budget — then hit the road.',
    color: '#3DDC84',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="landing-section">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        variants={stagger}
        style={{ textAlign: 'center', marginBottom: '3rem' }}
      >
        <motion.div variants={fadeUp}>
          <span className="landing-kicker">How it works</span>
        </motion.div>
        <motion.h2 variants={fadeUp} style={{ margin: '0.875rem 0 0.75rem' }}>
          From idea to itinerary in three steps
        </motion.h2>
        <motion.p
          variants={fadeUp}
          style={{ color: 'var(--color-text-secondary)', maxWidth: '560px', margin: '0 auto' }}
        >
          The AI does the heavy lifting — you just show up and enjoy the trip.
        </motion.p>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        variants={stagger}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}
      >
        {STEPS.map((s, i) => (
          <motion.div
            key={s.num}
            variants={scaleIn}
            className="glass-card-static"
            style={{ padding: '1.75rem 1.5rem', position: 'relative', overflow: 'hidden' }}
          >
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '55%',
                height: '100%',
                background: `radial-gradient(ellipse at top right, ${s.color}0f 0%, transparent 70%)`,
                pointerEvents: 'none',
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 'var(--radius-lg)',
                  background: `${s.color}14`,
                  color: s.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 0 18px ${s.color}22`,
                }}
              >
                <s.icon size={18} />
              </div>
              <span
                style={{
                  fontSize: '2rem',
                  fontWeight: 800,
                  color: 'rgba(255, 255, 255, 0.06)',
                  letterSpacing: '-0.03em',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {s.num}
              </span>
            </div>
            <h3 style={{ fontSize: '1.0625rem', marginBottom: '0.5rem' }}>{s.title}</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
              {s.text}
            </p>
            {i < STEPS.length - 1 && (
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: '50%',
                  right: '-0.75rem',
                  width: 24,
                  height: 2,
                  background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))',
                  opacity: 0.5,
                  display: 'none',
                }}
              />
            )}
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}