'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Cloud, MapPin, Hotel, Plane, UtensilsCrossed, Sunrise, CalendarDays, Wallet } from 'lucide-react';
import { fadeUp, stagger } from '@/lib/motion';

// ============================================================
// Showcase — three DOM-built mockups of the real app screens
// (itinerary, map, budget) presented with a subtle perspective
// tilt. Pure 2D DOM/CSS — no WebGL — plus a soft hover tilt.
// ============================================================

function MiniItinerary() {
  const items = [
    { icon: Sunrise, label: 'Day 1 · Golden beaches', extra: '09:30 Baga Beach', color: '#27F2FF' },
    { icon: Hotel, label: 'Day 2 · Casa Azul', extra: 'Check-in · Calangute', color: '#B16DFF' },
    { icon: MapPin, label: 'Day 3 · Old Goa tour', extra: 'Se Cathedral → Basilica', color: '#3DDC84' },
    { icon: UtensilsCrossed, label: 'Day 4 · Fish market lunch', extra: 'Vasco da Gama', color: '#FFB547' },
    { icon: Plane, label: 'Day 5 · Sunset cruise', extra: 'Mandovi river', color: '#FF6B6B' },
  ];
  return (
    <div
      style={{
        background: 'rgba(19, 21, 30, 0.9)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '1rem',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
      }}
    >
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.25rem' }}>
        <span style={{ fontSize: '0.625rem', fontWeight: 800, letterSpacing: '0.05em', color: 'var(--color-text-primary)' }}>
          ITINERARY
        </span>
        <span style={{ fontSize: '0.625rem', fontWeight: 600, color: 'var(--color-text-muted)', marginLeft: 'auto' }}>
          Goa · 5 days
        </span>
      </div>
      {items.map((it) => (
        <div key={it.label} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 'var(--radius-sm)',
              background: `${it.color}14`,
              color: it.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <it.icon size={13} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{it.label}</div>
            <div style={{ fontSize: '0.59375rem', color: 'var(--color-text-muted)' }}>{it.extra}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniMap() {
  return (
    <div
      style={{
        background: 'rgba(19, 21, 30, 0.9)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '1rem',
        boxShadow: 'var(--shadow-lg)',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.625rem', fontWeight: 800, letterSpacing: '0.05em', color: 'var(--color-text-primary)' }}>
          LIVE MAP
        </span>
        <span style={{ fontSize: '0.625rem', fontWeight: 600, color: 'var(--color-text-muted)', marginLeft: 'auto' }}>
          Route · 12 stops
        </span>
      </div>
      <div
        aria-hidden="true"
        style={{
          height: 96,
          borderRadius: 'var(--radius-md)',
          position: 'relative',
          background:
            'linear-gradient(160deg, rgba(39,242,255,0.05), rgba(177,109,255,0.04)), repeating-linear-gradient(0deg, rgba(39,242,255,0.06) 0 1px, transparent 1px 18px), repeating-linear-gradient(90deg, rgba(39,242,255,0.06) 0 1px, transparent 1px 18px)',
        }}
      >
        <svg viewBox="0 0 200 96" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          <path
            d="M18 78 C 55 74, 70 40, 105 44 S 165 22, 182 18"
            fill="none"
            stroke="url(#landingRoute)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="6 5"
          />
          <defs>
            <linearGradient id="landingRoute" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#27F2FF" />
              <stop offset="100%" stopColor="#B16DFF" />
            </linearGradient>
          </defs>
          <circle cx="18" cy="78" r="4" fill="#27F2FF" />
          <circle cx="182" cy="18" r="4" fill="#3DDC84" />
        </svg>
      </div>
      {['09:30 Calangute', '11:15 Baga Beach', '16:00 Fort Aguada'].map((t, i) => (
        <div
          key={t}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.59375rem',
            color: 'var(--color-text-secondary)',
            marginTop: '0.4rem',
            fontWeight: 600,
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: i === 0 ? 'var(--color-primary)' : i === 1 ? 'var(--color-secondary)' : 'var(--color-success)',
            }}
          />
          {t}
        </div>
      ))}
    </div>
  );
}

function MiniBudget() {
  const rows = [
    { icon: Plane, label: 'Flights', amount: '$210', color: '#27F2FF' },
    { icon: Hotel, label: 'Stay · 4 nights', amount: '$280', color: '#B16DFF' },
    { icon: UtensilsCrossed, label: 'Food', amount: '$140', color: '#FFB547' },
    { icon: MapPin, label: 'Activities', amount: '$95', color: '#3DDC84' },
  ];
  return (
    <div
      style={{
        background: 'rgba(19, 21, 30, 0.9)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '1rem',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.55rem',
      }}
    >
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.25rem' }}>
        <span style={{ fontSize: '0.625rem', fontWeight: 800, letterSpacing: '0.05em', color: 'var(--color-text-primary)' }}>
          BUDGET
        </span>
        <span style={{ fontSize: '0.625rem', fontWeight: 600, color: 'var(--color-text-muted)', marginLeft: 'auto' }}>
          $725 · Plan
        </span>
      </div>
      {rows.map((r) => (
        <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 'var(--radius-sm)',
              background: `${r.color}14`,
              color: r.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <r.icon size={13} />
          </div>
          <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>{r.label}</span>
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, marginLeft: 'auto', color: 'var(--color-text-primary)' }}>
            {r.amount}
          </span>
        </div>
      ))}
      <div
        style={{
          height: 6,
          borderRadius: 'var(--radius-full)',
          background: 'rgba(255,255,255,0.06)',
          overflow: 'hidden',
          marginTop: '0.25rem',
        }}
      >
        <div
          style={{
            width: '68%',
            height: '100%',
            borderRadius: 'var(--radius-full)',
            background: 'linear-gradient(90deg, #27F2FF, #3DDC84)',
          }}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <Wallet size={12} color="var(--color-success)" />
        <span style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--color-success)' }}>On budget</span>
        <span style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', marginLeft: 'auto' }}>
          <CalendarDays size={11} style={{ verticalAlign: '-1px' }} /> auto-tracked daily
        </span>
      </div>
    </div>
  );
}

export default function Showcase() {
  return (
    <section
      id="showcase"
      className="landing-section"
      style={{ paddingTop: '2.5rem' }}
    >
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        variants={stagger}
        style={{ textAlign: 'center', marginBottom: '3rem' }}
      >
        <motion.div variants={fadeUp}>
          <span className="landing-kicker">Product preview</span>
        </motion.div>
        <motion.h2 variants={fadeUp} style={{ margin: '0.875rem 0 0.75rem' }}>
          See your trip before you go
        </motion.h2>
        <motion.p
          variants={fadeUp}
          style={{ color: 'var(--color-text-secondary)', maxWidth: '560px', margin: '0 auto' }}
        >
          A live, editable plan — itinerary, map and budget in one place. Try the real thing in the planner.
        </motion.p>
      </motion.div>

      <div
        style={{
          perspective: '1600px',
          transformStyle: 'preserve-3d',
        }}
      >
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={stagger}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
            gap: '1.25rem',
            transform: 'rotateX(6deg)',
            transformStyle: 'preserve-3d',
          }}
        >
          {[
            { key: 'mini-itinerary', el: <MiniItinerary /> },
            { key: 'mini-map', el: <MiniMap /> },
            { key: 'mini-budget', el: <MiniBudget /> },
          ].map((card) => (
            <motion.div
              key={card.key}
              variants={fadeUp}
              whileHover={{ rotateX: 10, rotateY: -6, scale: 1.03, translateY: -6 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              {card.el}
            </motion.div>
          ))}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4 }}
        style={{ textAlign: 'center', marginTop: '2.5rem' }}
      >
        <Link href="/map" className="btn-ghost" style={{ fontSize: '0.8125rem', padding: '0.625rem 1.25rem' }}>
          <Cloud size={14} style={{ verticalAlign: '-2px', marginRight: 8 }} />
          Explore the live map
        </Link>
      </motion.div>
    </section>
  );
}