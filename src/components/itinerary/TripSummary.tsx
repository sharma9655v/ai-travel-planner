'use client';

import { TripSummary as TripSummaryType } from '@/types/itinerary';
import { Calendar, Clock3, Compass, MapPin, Sparkles } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function TripSummary({ summary }: { summary: TripSummaryType }) {
  if (!summary) return null;

  return (
    <div style={{ marginBottom: '2rem' }}>
      {/* Hero Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          position: 'relative',
          padding: '2.5rem 1.5rem',
          borderRadius: 'var(--radius-2xl)',
          background: 'linear-gradient(135deg, rgba(39, 242, 255, 0.08) 0%, rgba(177, 109, 255, 0.08) 100%)',
          overflow: 'hidden',
          marginBottom: '1.5rem',
          border: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        {/* Glow orb */}
        <div
          style={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(39, 242, 255, 0.1) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Sparkles size={16} color="var(--color-primary)" />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-primary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Your Trip
            </span>
          </div>

          <h1 style={{ fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', fontWeight: 800, marginBottom: '0.75rem' }}>
            <span className="gradient-text">{summary.destination}</span> Adventure
          </h1>

          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem', maxWidth: '500px', margin: '0 auto 1.5rem' }}>
            {summary.coverDescription}
          </p>

          {/* Info Badges */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.5rem' }}>
            <InfoBadge icon={<Calendar size={14} />} text={`${formatDate(summary.startDate)} — ${formatDate(summary.endDate)}`} />
            <InfoBadge icon={<MapPin size={14} />} text={`${summary.totalDays} Days`} />
            {summary.bestTimeToVisit && <InfoBadge icon={<Clock3 size={14} />} text={`Best: ${summary.bestTimeToVisit}`} />}
            <InfoBadge icon={<Compass size={14} />} text={summary.travelStyle} />
          </div>
        </div>
      </motion.div>

      {/* Highlights */}
      {summary.highlights && summary.highlights.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <div style={{ width: 4, height: 16, borderRadius: 2, background: 'var(--color-primary)' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Trip Highlights</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
            {summary.highlights.map((highlight, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: 'var(--radius-lg)',
                }}
              >
                <Sparkles size={12} color="var(--color-primary)" style={{ marginTop: 2, flexShrink: 0 }} />
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                  {highlight}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoBadge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.5rem 0.875rem',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 'var(--radius-full)',
        fontSize: '0.75rem',
        fontWeight: 600,
        color: 'var(--color-text-primary)',
      }}
    >
      <span style={{ color: 'var(--color-text-muted)' }}>{icon}</span>
      {text}
    </div>
  );
}
