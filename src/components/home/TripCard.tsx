'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, MapPin, Trash2 } from 'lucide-react';
import type { SavedItinerary } from '@/types/itinerary';
import { formatDate } from '@/lib/utils';
import { fadeUp } from '@/lib/motion';

interface TripCardProps {
  trip: SavedItinerary;
  onDelete: (id: string) => void;
}

export default function TripCard({ trip, onDelete }: TripCardProps) {
  const { destination, startDate, totalDays } = trip.itinerary.tripSummary;

  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ x: 4 }}
      className="glass-card-static"
      style={{
        padding: '1rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        transition: 'all 250ms',
      }}
    >
      <Link
        href={`/itinerary/${trip.id}`}
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          textDecoration: 'none',
          minWidth: 0,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 'var(--radius-lg)',
            background: 'rgba(255, 255, 255, 0.04)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
            flexShrink: 0,
          }}
        >
          <MapPin size={22} color="var(--color-primary-light)" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '0.9375rem',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {destination}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            {formatDate(startDate)} · {totalDays} days
          </div>
        </div>
      </Link>
      <button
        onClick={() => onDelete(trip.id)}
        aria-label={`Delete trip to ${destination}`}
        title="Delete trip"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '0.5rem',
          borderRadius: 'var(--radius-full)',
          color: 'var(--color-text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Trash2 size={16} />
      </button>
      <ArrowRight size={16} color="var(--color-text-muted)" style={{ flexShrink: 0 }} />
    </motion.div>
  );
}