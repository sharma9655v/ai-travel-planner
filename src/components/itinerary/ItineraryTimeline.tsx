'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DayPlan } from '@/types/itinerary';
import DayCard from './DayCard';

export default function ItineraryTimeline({
  dailyItinerary,
}: {
  dailyItinerary: DayPlan[];
}) {
  const [activeDay, setActiveDay] = useState(0);

  if (!dailyItinerary || dailyItinerary.length === 0) return null;

  return (
    <div style={{ marginBottom: '2rem' }}>
      {/* Section Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1.25rem',
        }}
      >
        <div
          style={{
            width: 4,
            height: 20,
            borderRadius: 2,
            background: 'linear-gradient(180deg, #27F2FF, #B16DFF)',
          }}
        />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Daily Itinerary</h2>
      </div>

      {/* Day Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1.25rem',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          paddingBottom: '0.25rem',
        }}
      >
        {dailyItinerary.map((day, index) => (
          <motion.button
            key={day.day}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveDay(index)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-full)',
              background:
                activeDay === index
                  ? 'rgba(39, 242, 255, 0.12)'
                  : 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${
                activeDay === index
                  ? 'rgba(39, 242, 255, 0.3)'
                  : 'rgba(255, 255, 255, 0.06)'
              }`,
              color:
                activeDay === index
                  ? 'var(--color-primary)'
                  : 'var(--color-text-muted)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontFamily: 'inherit',
              transition: 'all 250ms',
              boxShadow:
                activeDay === index
                  ? '0 0 12px rgba(39, 242, 255, 0.15)'
                  : 'none',
            }}
          >
            Day {day.day}
          </motion.button>
        ))}
      </div>

      {/* Active Day Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeDay}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
        >
          <DayCard day={dailyItinerary[activeDay]} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
