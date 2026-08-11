'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star, ArrowUpRight } from 'lucide-react';
import { useRef } from 'react';
import { fadeUp, scaleIn, stagger } from '@/lib/motion';

const DESTINATIONS = [
  { name: 'Goa', flag: '🇮🇳', emoji: '🏖️', tagline: '5-day beach & culture escape', rating: 4.8 },
  { name: 'Jaipur', flag: '🇮🇳', emoji: '🏰', tagline: 'Pink City heritage tour', rating: 4.7 },
  { name: 'Manali', flag: '🇮🇳', emoji: '🏔️', tagline: 'Himalayan adventure trip', rating: 4.9 },
  { name: 'Dubai', flag: '🇦🇪', emoji: '🌆', tagline: 'Luxury city break', rating: 4.8 },
  { name: 'Bali', flag: '🇮🇩', emoji: '🌴', tagline: 'Island wellness retreat', rating: 4.9 },
  { name: 'Tokyo', flag: '🇯🇵', emoji: '🗼', tagline: 'City & culture deep dive', rating: 4.8 },
];

export default function Destinations() {
  const trackRef = useRef<HTMLDivElement | null>(null);

  function scrollBy(dir: 1 | -1) {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector<HTMLElement>('[data-card]');
    const amount = (card?.offsetWidth ?? 280) + 16;
    track.scrollBy({ left: dir * amount, behavior: 'smooth' });
  }

  return (
    <section id="destinations" className="landing-section" style={{ paddingTop: '2.5rem' }}>
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        variants={stagger}
        style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}
      >
        <div>
          <motion.div variants={fadeUp}>
            <span className="landing-kicker">Destinations</span>
          </motion.div>
          <motion.h2 variants={fadeUp} style={{ margin: '0.875rem 0 0.5rem' }}>
            Where will you go next?
          </motion.h2>
          <motion.p variants={fadeUp} style={{ color: 'var(--color-text-secondary)', maxWidth: '460px' }}>
            Pick a vibe — the AI fills in the perfect plan.
          </motion.p>
        </div>
        <motion.div variants={fadeUp} style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            aria-label="Scroll destinations left"
            className="btn-secondary"
            style={{ width: 40, height: 40, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-md)' }}
            onClick={() => scrollBy(-1)}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            aria-label="Scroll destinations right"
            className="btn-secondary"
            style={{ width: 40, height: 40, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-md)' }}
            onClick={() => scrollBy(1)}
          >
            <ChevronRight size={16} />
          </button>
        </motion.div>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        variants={stagger}
      >
        <div
          ref={trackRef}
          style={{
            display: 'flex',
            gap: '1rem',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            padding: '0.25rem 0.25rem 1rem',
            scrollSnapType: 'x proximity',
          }}
        >
          {DESTINATIONS.map((d) => (
            <motion.div key={d.name} variants={scaleIn}>
              <Link
                href="/plan"
                data-card
                style={{
                  textDecoration: 'none',
                  display: 'block',
                  minWidth: 240,
                  maxWidth: 240,
                  flexShrink: 0,
                  scrollSnapAlign: 'start',
                }}
              >
                <motion.div
                  whileHover={{ y: -6, scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                  className="glass-card-static"
                  style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden' }}
                >
                  <div
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 90,
                      background:
                        'radial-gradient(ellipse at 20% 0%, rgba(39,242,255,0.12) 0%, transparent 60%), radial-gradient(ellipse at 90% 20%, rgba(177,109,255,0.1) 0%, transparent 55%)',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                    }}
                  />
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ fontSize: '2.25rem', lineHeight: 1.2 }}>{d.emoji}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', margin: '0.5rem 0 0.125rem' }}>
                      <span style={{ fontSize: '1.0625rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                        {d.name}
                      </span>
                      <span style={{ fontSize: '0.9375rem' }}>{d.flag}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
                      {d.tagline}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                        <Star size={11} fill="#FFB547" color="#FFB547" />
                        {d.rating}
                      </span>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          color: 'var(--color-primary)',
                        }}
                      >
                        Plan it
                        <ArrowUpRight size={12} />
                      </span>
                    </div>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}