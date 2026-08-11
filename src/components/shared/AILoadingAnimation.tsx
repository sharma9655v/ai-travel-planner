'use client';

import { motion } from 'framer-motion';
import { Globe, MapPin, Star } from 'lucide-react';

export default function AILoadingAnimation({ destination }: { destination: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        padding: '2rem',
        position: 'relative',
      }}
    >
      {/* Background Glow */}
      <div
        style={{
          position: 'absolute',
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(39, 242, 255, 0.08) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      {/* Orbital Ring */}
      <div style={{ position: 'relative', width: 120, height: 120, marginBottom: '2rem' }}>
        {/* Outer ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '2px solid transparent',
            borderTopColor: 'var(--color-primary)',
            borderRightColor: 'rgba(39, 242, 255, 0.3)',
          }}
        />

        {/* Inner ring */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            inset: 15,
            borderRadius: '50%',
            border: '1.5px solid transparent',
            borderTopColor: 'var(--color-secondary)',
            borderLeftColor: 'rgba(177, 109, 255, 0.3)',
          }}
        />

        {/* Center: brand mark */}
        <div
          style={{
            position: 'absolute',
            inset: 30,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(39, 242, 255, 0.15), rgba(177, 109, 255, 0.15))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{ display: 'flex' }}
          >
            <svg width="26" height="26" viewBox="0 0 64 64" fill="none" aria-hidden="true">
              <defs>
                <linearGradient id="atp-loading-needle" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#27F2FF" />
                  <stop offset="1" stopColor="#B16DFF" />
                </linearGradient>
              </defs>
              <circle cx="32" cy="32" r="19.5" fill="none" stroke="url(#atp-loading-needle)" strokeWidth="2.5" opacity="0.9" />
              <path d="M32 19.5 L36 32 L32 44.5 L28 32 Z" fill="url(#atp-loading-needle)" />
            </svg>
          </motion.div>
        </div>

        {/* Orbiting dots */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ rotate: 360 }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              ease: 'linear',
              delay: i * 0.5,
            }}
            style={{
              position: 'absolute',
              inset: -5,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: i === 0 ? 'var(--color-primary)' : i === 1 ? 'var(--color-secondary)' : 'var(--color-success)',
                boxShadow: `0 0 8px ${i === 0 ? 'var(--color-primary)' : i === 1 ? 'var(--color-secondary)' : 'var(--color-success)'}`,
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
              }}
            />
          </motion.div>
        ))}
      </div>

      {/* Text */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}
        role="status"
        aria-live="polite"
      >
        <h2 style={{ fontSize: '1.375rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Planning your{' '}
          <span className="gradient-text">{destination}</span> trip
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
          AI is crafting your perfect itinerary...
        </p>

        {/* Loading Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '280px', margin: '0 auto' }}>
          {[
            { icon: Globe, text: 'Analyzing destination...' },
            { icon: MapPin, text: 'Finding best routes...' },
            { icon: Star, text: 'Generating activities...' },
          ].map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.7 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.75rem',
                color: 'var(--color-text-muted)',
              }}
            >
              <step.icon size={14} color="var(--color-primary)" />
              {step.text}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
