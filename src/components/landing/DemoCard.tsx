'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Cloud, Route, Sparkles, Check, ArrowRight, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';

// ============================================================
// DemoCard — purely visual simulation of AI trip generation.
// Cycles through 4 steps, then shows the finished "5 DAYS IN GOA"
// plan. No API calls, no network, no shared state.
// ============================================================

const STEPS = [
  { icon: Sparkles, label: 'Analyzing your dream destination' },
  { icon: Route, label: 'Optimizing routes & travel time' },
  { icon: Cloud, label: 'Checking live weather for every day' },
];

const DAYS = [
  { day: 'Day 1', label: 'Golden beaches' },
  { day: 'Day 2', label: 'Water sports' },
  { day: 'Day 3', label: 'Spice farms' },
  { day: 'Day 4', label: 'Old Goa heritage' },
  { day: 'Day 5', label: 'Sunset cruise' },
];

const STEP_MS = 1100;
const DONE_MS = 3600;

export default function DemoCard() {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;

    function schedule() {
      setStep(0);
      setDone(false);
      const timers: ReturnType<typeof setTimeout>[] = [];

      STEPS.forEach((_, i) => {
        timers.push(
          setTimeout(() => {
            if (cancelled) return;
            setStep(i);
          }, i * STEP_MS)
        );
      });
      timers.push(
        setTimeout(() => {
          if (cancelled) return;
          setDone(true);
        }, STEPS.length * STEP_MS)
      );
      timers.push(
        setTimeout(() => {
          if (cancelled) return;
          schedule();
        }, STEPS.length * STEP_MS + DONE_MS)
      );
      return timers;
    }

    const timers = schedule();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="AI trip plan demo simulation"
      className="glass-card-static"
      style={{
        width: 'min(300px, 82vw)',
        padding: '1.25rem',
        boxShadow: 'var(--shadow-xl), var(--shadow-glow-cyan)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
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
          <Sparkles size={13} color="#090B10" />
        </div>
        <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          AI Travel Planner
        </span>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: '0.625rem',
            fontWeight: 700,
            color: 'var(--color-primary)',
            background: 'var(--color-primary-muted)',
            border: '1px solid rgba(39, 242, 255, 0.2)',
            borderRadius: 'var(--radius-full)',
            padding: '0.125rem 0.5rem',
          }}
        >
          {done ? 'LIVE PREVIEW' : 'SIMULATION'}
        </span>
      </div>

      {!done ? (
        <>
          {/* Step list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {STEPS.map((s, i) => {
              const active = i === step;
              const completed = i < step;
              return (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: completed
                        ? 'rgba(61, 220, 132, 0.12)'
                        : active
                          ? 'var(--color-primary-muted)'
                          : 'rgba(255, 255, 255, 0.04)',
                      color: completed ? 'var(--color-success)' : active ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    }}
                  >
                    {completed ? (
                      <Check size={12} />
                    ) : (
                      <s.icon size={12} style={active ? { animation: 'spin 1.2s linear infinite' } : undefined} />
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: active || completed ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                    }}
                  >
                    {s.label}
                    {active && (
                      <motion.span
                        animate={{ opacity: [1, 0.2, 1] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                        style={{ color: 'var(--color-primary)', marginLeft: '0.5rem' }}
                      >
                        …
                      </motion.span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Progress bar */}
          <div
            style={{
              marginTop: '1rem',
              height: 3,
              borderRadius: 'var(--radius-full)',
              background: 'rgba(255, 255, 255, 0.06)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${((step + (done ? 1 : 0)) / STEPS.length) * 100}%`,
                background: 'linear-gradient(90deg, #27F2FF, #B16DFF)',
                borderRadius: 'var(--radius-full)',
                transition: 'width 500ms cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: 'var(--shadow-glow-sm)',
              }}
            />
          </div>
        </>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '0.9rem' }}>
            <span style={{ fontSize: '1.125rem', fontWeight: 800, letterSpacing: '-0.01em' }}>5 DAYS IN GOA</span>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-secondary)' }}>AI PLAN</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem' }}>
            {DAYS.map((d) => (
              <div
                key={d.day}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                }}
              >
                <span
                  style={{
                    color: 'var(--color-primary)',
                    background: 'var(--color-primary-muted)',
                    border: '1px solid rgba(39, 242, 255, 0.18)',
                    borderRadius: 'var(--radius-full)',
                    padding: '0.0625rem 0.5rem',
                    flexShrink: 0,
                  }}
                >
                  {d.day}
                </span>
                <span style={{ color: 'var(--color-text-secondary)' }}>{d.label}</span>
              </div>
            ))}
          </div>
          <Link
            href="/plan"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#090B10',
              background: 'linear-gradient(135deg, #27F2FF, #B16DFF)',
              borderRadius: 'var(--radius-md)',
              padding: '0.55rem 1rem',
              textDecoration: 'none',
            }}
          >
            <MapPin size={13} />
            View full plan
            <ArrowRight size={13} />
          </Link>
        </motion.div>
      )}
    </div>
  );
}