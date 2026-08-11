'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Activity } from '@/types/itinerary';
import {
  Clock,
  MapPin,
  Star,
  Navigation,
  ShoppingBag,
  Eye,
  Utensils,
  Camera,
  Mountain,
  Music,
  Waves,
  Heart,
  Sparkles,
  Footprints,
  RefreshCw,
} from 'lucide-react';

const categoryConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  sightseeing: { icon: Eye, color: '#27F2FF', label: 'Sightseeing' },
  food: { icon: Utensils, color: '#FFB547', label: 'Food' },
  transport: { icon: Navigation, color: '#70E1FF', label: 'Transport' },
  accommodation: { icon: Heart, color: '#B16DFF', label: 'Stay' },
  adventure: { icon: Mountain, color: '#3DDC84', label: 'Adventure' },
  shopping: { icon: ShoppingBag, color: '#FF6B6B', label: 'Shopping' },
  relaxation: { icon: Waves, color: '#70E1FF', label: 'Relax' },
  culture: { icon: Camera, color: '#B16DFF', label: 'Culture' },
  nightlife: { icon: Music, color: '#FF6B6B', label: 'Nightlife' },
  wellness: { icon: Heart, color: '#3DDC84', label: 'Wellness' },
};

export default function ActivityCard({
  activity,
}: {
  activity: Activity;
}) {
  const config = categoryConfig[activity.category] || categoryConfig.sightseeing;
  const Icon = config.icon;
  const [notice, setNotice] = React.useState<string | null>(null);
  const rating = activity.rating;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="glass-card-static"
      style={{
        padding: '1rem',
        marginBottom: '0.75rem',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(255, 255, 255, 0.035)',
        backdropFilter: 'blur(20px)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top Main Row */}
      <div style={{ display: 'flex', gap: '0.875rem' }}>
        {/* Time Column & Accent Line */}
        <div
          style={{
            minWidth: '56px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.375rem',
          }}
        >
          <span
            style={{
              fontSize: '0.8125rem',
              fontWeight: 800,
              color: 'var(--color-primary)',
              fontFamily: 'monospace',
              letterSpacing: '-0.02em',
            }}
          >
            {activity.time}
          </span>
          <div
            style={{
              width: 3,
              flex: 1,
              minHeight: 32,
              background: `linear-gradient(180deg, ${config.color}, transparent)`,
              borderRadius: 2,
              opacity: 0.7,
            }}
          />
        </div>

        {/* Content Details */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Category Tag & Weather Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem',
              marginBottom: '0.375rem',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.2rem 0.6rem',
                borderRadius: 'var(--radius-full)',
                background: `${config.color}15`,
                border: `1px solid ${config.color}30`,
              }}
            >
              <Icon size={12} color={config.color} />
              <span
                style={{
                  fontSize: '0.625rem',
                  fontWeight: 700,
                  color: config.color,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {config.label}
              </span>
            </div>
          </div>

          {/* Activity Name */}
          <h4
            style={{
              fontSize: '1rem',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              lineHeight: 1.3,
              marginBottom: '0.25rem',
            }}
          >
            {activity.name}
          </h4>

          {/* Description */}
          {activity.description && (
            <p
              style={{
                fontSize: '0.8125rem',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.5,
                marginBottom: '0.5rem',
              }}
            >
              {activity.description}
            </p>
          )}

          {/* Location */}
          {activity.location && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                marginBottom: '0.625rem',
              }}
            >
              <MapPin size={12} color="var(--color-primary-light)" />
              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--color-text-muted)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {activity.location}
              </span>
            </div>
          )}

          {/* Metrics Pill Grid */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              flexWrap: 'wrap',
              marginBottom: '0.75rem',
            }}
          >
            {/* Duration */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Clock size={12} color="var(--color-text-muted)" />
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                {activity.duration}
              </span>
            </div>

            {/* Opening Hours */}
            {activity.openingHours && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Clock size={12} color="var(--color-warning)" />
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                  Open {activity.openingHours}
                </span>
              </div>
            )}

            {/* Distance — only when the plan actually includes one */}
            {activity.distance && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Footprints size={12} color="var(--color-secondary)" />
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                  {activity.distance}
                </span>
              </div>
            )}

            {/* Rating — only when the plan actually includes one */}
            {rating ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.2px' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={10}
                    fill={star <= Math.round(rating) ? '#FFB547' : 'transparent'}
                    color={star <= Math.round(rating) ? '#FFB547' : 'var(--color-text-muted)'}
                  />
                ))}
                <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginLeft: '0.25rem' }}>{rating}</span>
              </div>
            ) : null}
          </div>

          {/* Action Button Bar */}
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              flexWrap: 'wrap',
              alignItems: 'center',
              paddingTop: '0.5rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <motion.a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.location || activity.name)}`}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(39, 242, 255, 0.1)',
                border: '1px solid rgba(39, 242, 255, 0.25)',
                color: 'var(--color-primary)',
                fontSize: '0.75rem',
                fontWeight: 600,
                textDecoration: 'none',
                cursor: 'pointer',
              }}
            >
              <Navigation size={12} />
              Navigate
            </motion.a>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setNotice(`AI replacement for ${activity.name} isn't available yet.`)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'var(--color-text-secondary)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={12} />
              Replace
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setNotice("Automatic re-routing isn't available yet.")}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(177, 109, 255, 0.12)',
                border: '1px solid rgba(177, 109, 255, 0.3)',
                color: 'var(--color-secondary)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                marginLeft: 'auto',
              }}
            >
              <Sparkles size={12} />
              Magic Re-route
            </motion.button>
          </div>
          {notice && (
            <div
              style={{
                fontSize: '0.6875rem',
                color: 'var(--color-text-muted)',
                marginTop: '0.5rem',
              }}
            >
              {notice}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
