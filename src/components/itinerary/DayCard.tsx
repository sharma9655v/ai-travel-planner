'use client';

import { motion } from 'framer-motion';
import { DayPlan } from '@/types/itinerary';
import ActivityCard from './ActivityCard';
import { Calendar, Sparkles } from 'lucide-react';

export default function DayCard({ day }: { day: DayPlan }) {
  if (!day) return null;

  return (
    <div>
      {/* Day Header */}
      <div
        className="glass-card-static"
        style={{
          padding: '1.25rem',
          marginBottom: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {day.title}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <Calendar size={12} color="var(--color-text-muted)" />
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              Day {day.day}
            </span>
          </div>
        </div>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: '0.75rem' }}>
          {day.summary}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              {day.activities?.length || 0} activities
            </span>
          </div>
        </div>
      </div>

      {/* Activities Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {day.activities?.map((activity, index) => (
          <motion.div
            key={`${activity.time}-${index}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <ActivityCard activity={activity} />
          </motion.div>
        ))}
      </div>

      {/* Magic Re-route Button */}
      <motion.button
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        className="btn-glow"
        style={{
          width: '100%',
          marginTop: '1rem',
          padding: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
        }}
      >
        <Sparkles size={14} />
        MAGIC RE-ROUTE
      </motion.button>
    </div>
  );
}
