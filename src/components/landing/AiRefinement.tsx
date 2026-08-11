'use client';

import { motion } from 'framer-motion';
import { Bot, SendHorizonal, Check } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { fadeUp, scaleIn, stagger } from '@/lib/motion';

// ============================================================
// AiRefinement — simulated AI chat handoff. Purely local state,
// no API calls. Plays a short scripted exchange once the section
// scrolls into view, then holds.
// ============================================================

const SUGGESTIONS = [
  { label: 'Make it more relaxed', emoji: '🌴' },
  { label: 'Add hidden gems', emoji: '💎' },
  { label: 'Stick to the budget', emoji: '💸' },
];

const SCRIPT: Bubble[] = [
  { from: 'user', text: 'Can we swap Day 2 for a quieter beach day?' },
  { from: 'ai', text: 'Done! Day 2 now starts at Ashwem Beach — low tide swim in the morning, beach-hut lunch, and a cliff-side sunset. Kept your evening cruise.', chips: ['Day 2 recalculated', 'Sunset cruise kept'] },
  { from: 'user', text: 'Perfect. What about local food?' },
  { from: 'ai', text: 'Added 3 hidden gems: a family-run fish thali joint, a palm-spice plantation lunch, and a 200-year-old bakery in Old Goa. Budget impact: +$18.', chips: ['Fish thali · St Inez', 'Plantation lunch'] },
];

type Bubble = { from: 'user' | 'ai'; text: string; chips?: string[] };

export default function AiRefinement() {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [replay, setReplay] = useState(false);
  const started = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const handle = timers.current;
    return () => handle.forEach(clearTimeout);
  }, []);

  function play() {
    started.current = true;
    setReplay(false);
    setBubbles([]);
    SCRIPT.forEach((b, i) => {
      timers.current.push(
        setTimeout(() => {
          setBubbles((prev) => [...prev, b]);
        }, 500 + i * 1300)
      );
    });
    timers.current.push(
      setTimeout(() => setReplay(true), 500 + SCRIPT.length * 1300 + 1400)
    );
  }

  return (
    <section id="ai-refinement" className="landing-section" style={{ paddingTop: '2.5rem' }}>
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
        variants={stagger}
        style={{ textAlign: 'center', marginBottom: '2.5rem' }}
      >
        <motion.div variants={fadeUp}>
          <span className="landing-kicker" style={{ color: 'var(--color-primary)', background: 'var(--color-primary-muted)', borderColor: 'rgba(39,242,255,0.2)' }}>
            AI refinement
          </span>
        </motion.div>
        <motion.h2 variants={fadeUp} style={{ margin: '0.875rem 0 0.75rem' }}>
          Your plan, in your words
        </motion.h2>
        <motion.p
          variants={fadeUp}
          style={{ color: 'var(--color-text-secondary)', maxWidth: '560px', margin: '0 auto' }}
        >
          Don&apos;t like a detail? Just tell the AI. Every change re-routes the plan instantly.
        </motion.p>
      </motion.div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          alignItems: 'center',
        }}
      >
        {/* Suggestions */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          variants={stagger}
          style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
        >
          <motion.div variants={fadeUp}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
              Try saying something like…
            </span>
          </motion.div>
          {SUGGESTIONS.map((s) => (
            <motion.button
              key={s.label}
              variants={scaleIn}
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.97 }}
              className="glass-card-static"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                padding: '0.875rem 1.125rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                cursor: 'pointer',
                textAlign: 'left',
                borderRadius: 'var(--radius-lg)',
                fontFamily: 'inherit',
              }}
            >
              <span style={{ fontSize: '1rem' }}>{s.emoji}</span>
              {s.label}
              <SendHorizonal
                size={13}
                style={{ marginLeft: 'auto', color: 'var(--color-text-muted)' }}
              />
            </motion.button>
          ))}
          <motion.div variants={fadeUp} style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
            *Simulation — the live AI chat lives inside the planner.
          </motion.div>
        </motion.div>

        {/* Chat mock */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px', amount: 0.3 }}
          variants={fadeUp}
          className="glass-card-static"
          style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: 300 }}
        >
          {/* Chat header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: 'var(--radius-sm)',
                background: 'linear-gradient(135deg, #27F2FF, #B16DFF)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bot size={13} color="#090B10" />
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>Trip Assistant</span>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--color-success)',
                boxShadow: '0 0 8px var(--color-success)',
                marginLeft: 'auto',
              }}
            />
          </div>

          {/* Bubbles */}
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', flex: 1 }}
            role="log"
            aria-label="Simulated AI trip chat"
          >
            {bubbles.length === 0 && (
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: 'auto' }}>
                The assistant will respond here…
              </div>
            )}
            {bubbles.map((b, i) => (
              <motion.div
                key={`${b.from}-${i}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                style={{ alignSelf: b.from === 'user' ? 'flex-end' : 'flex-start', maxWidth: '88%' }}
              >
                <div
                  style={{
                    fontSize: '0.75rem',
                    lineHeight: 1.55,
                    padding: '0.625rem 0.875rem',
                    borderRadius: b.from === 'user' ? 'var(--radius-lg) var(--radius-lg) 4px var(--radius-lg)' : 'var(--radius-lg) var(--radius-lg) var(--radius-lg) 4px',
                    background: b.from === 'user' ? 'linear-gradient(135deg, rgba(39,242,255,0.16), rgba(177,109,255,0.16))' : 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  {b.text}
                </div>
                {b.chips && (
                  <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginTop: '0.375rem' }}>
                    {b.chips.map((c) => (
                      <span
                        key={c}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          fontSize: '0.625rem',
                          fontWeight: 700,
                          color: 'var(--color-success)',
                          background: 'rgba(61, 220, 132, 0.1)',
                          border: '1px solid rgba(61, 220, 132, 0.2)',
                          borderRadius: 'var(--radius-full)',
                          padding: '0.1875rem 0.625rem',
                        }}
                      >
                        <Check size={10} />
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Input mock */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 'var(--radius-full)',
              padding: '0.5rem 0.75rem 0.5rem 1rem',
            }}
          >
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', flex: 1 }}>
              Ask to tweak your plan…
            </span>
            <button
              aria-label="Replay simulated chat"
              onClick={() => {
                if (!started.current) play();
                else if (replay) play();
              }}
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                border: 'none',
                cursor: 'pointer',
                background: 'linear-gradient(135deg, #27F2FF, #B16DFF)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#090B10',
              }}
            >
              <SendHorizonal size={13} />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}