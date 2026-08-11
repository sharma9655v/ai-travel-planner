'use client';

import { motion } from 'framer-motion';
import { Accommodation } from '@/types/itinerary';
import { Star, MapPin } from 'lucide-react';

export default function AccommodationCard({
  accommodations,
}: {
  accommodations: Accommodation[];
}) {
  if (!accommodations || accommodations.length === 0) return null;

  return (
    <div style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <div style={{ width: 4, height: 20, borderRadius: 2, background: 'linear-gradient(180deg, #B16DFF, #FFB547)' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Accommodations</h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {accommodations.map((acc, i) => (
          <motion.div
            key={`acc-${i}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card-static"
            style={{ padding: '1.25rem' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.125rem' }}>
                  {acc.name}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--color-secondary)', fontWeight: 600, background: 'rgba(177, 109, 255, 0.1)', padding: '0.125rem 0.5rem', borderRadius: 'var(--radius-full)' }}>
                    {acc.type}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.125rem' }}>
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star key={s} size={8} fill={s < acc.rating ? '#FFB547' : 'transparent'} color={s < acc.rating ? '#FFB547' : 'var(--color-text-muted)'} />
                    ))}
                    <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginLeft: '0.25rem' }}>
                      {acc.rating}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {acc.location && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem' }}>
                <MapPin size={10} color="var(--color-text-muted)" />
                <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>{acc.location}</span>
              </div>
            )}

            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
              {acc.description}
            </p>

            {/* Amenities */}
            {acc.amenities && acc.amenities.length > 0 && (
              <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                {acc.amenities.slice(0, 5).map((amenity, ai) => (
                  <span
                    key={ai}
                    style={{
                      fontSize: '0.625rem',
                      fontWeight: 500,
                      color: 'var(--color-text-muted)',
                      background: 'rgba(255, 255, 255, 0.04)',
                      padding: '0.25rem 0.5rem',
                      borderRadius: 'var(--radius-full)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                    }}
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
