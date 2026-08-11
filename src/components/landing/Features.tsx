'use client';

import { motion } from 'framer-motion';
import { Cloud, Route, Wallet, CalendarDays, Shield, Sparkles } from 'lucide-react';
import { fadeUp, scaleIn, stagger } from '@/lib/motion';

const FEATURES = [
  {
    icon: Cloud,
    title: 'Weather-Smart Itineraries',
    text: 'Every day is planned around real-time weather — sunny beach time, indoor museums on rainy days.',
    color: '#27F2FF',
  },
  {
    icon: Route,
    title: 'Optimized Routing',
    text: 'Point-to-point routes minimize travel time between stops, so you see more and drive less.',
    color: '#B16DFF',
  },
  {
    icon: Wallet,
    title: 'Live Budget Tracking',
    text: 'Auto-categorized cost estimates keep your spend visible — and the whole plan on budget.',
    color: '#3DDC84',
  },
  {
    icon: CalendarDays,
    title: 'All-In-One Day Plans',
    text: 'Flights, hotels, food and activities land in one deliverable, day-by-day plan.',
    color: '#FFB547',
  },
  {
    icon: Shield,
    title: 'Safety First',
    text: 'Emergency info, local alerts and vital numbers are included on every single plan.',
    color: '#FF6B6B',
  },
  {
    icon: Sparkles,
    title: 'Hidden Gems',
    text: 'The AI surfaces authentic spots locals love — no tourist traps, no filler.',
    color: '#70E1FF',
  },
];

export default function Features() {
  return (
    <section id="features" className="landing-section" style={{ paddingTop: '2.5rem' }}>
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        variants={stagger}
        style={{ textAlign: 'center', marginBottom: '3rem' }}
      >
        <motion.div variants={fadeUp}>
          <span className="landing-kicker">Features</span>
        </motion.div>
        <motion.h2 variants={fadeUp} style={{ margin: '0.875rem 0 0.75rem' }}>
          Everything a great trip needs
        </motion.h2>
        <motion.p
          variants={fadeUp}
          style={{ color: 'var(--color-text-secondary)', maxWidth: '560px', margin: '0 auto' }}
        >
          One AI planner that replaces ten travel apps.
        </motion.p>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        variants={stagger}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}
      >
        {FEATURES.map((f) => (
          <motion.div
            key={f.title}
            variants={scaleIn}
            whileHover={{ y: -4 }}
            className="glass-card-static"
            style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}
          >
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '50%',
                height: '100%',
                background: `radial-gradient(ellipse at top right, ${f.color}0d 0%, transparent 70%)`,
                pointerEvents: 'none',
              }}
            />
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 'var(--radius-lg)',
                background: `${f.color}14`,
                color: f.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
                boxShadow: `0 0 20px ${f.color}1e`,
              }}
            >
              <f.icon size={20} />
            </div>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>{f.title}</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
              {f.text}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}