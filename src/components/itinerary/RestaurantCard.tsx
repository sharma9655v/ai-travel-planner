'use client';

import { motion } from 'framer-motion';
import { Restaurant } from '@/types/itinerary';
import { Star, MapPin, UtensilsCrossed } from 'lucide-react';

export default function RestaurantCard({ restaurants }: { restaurants: Restaurant[] }) {
  if (!restaurants || restaurants.length === 0) return null;

  return (
    <div style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <div style={{ width: 4, height: 20, borderRadius: 2, background: 'linear-gradient(180deg, #FFB547, #FF6B6B)' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Restaurants</h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {restaurants.map((restaurant, i) => (
          <motion.div
            key={`rest-${i}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card-static"
            style={{ padding: '1.25rem' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                  {restaurant.name}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--color-warning)', fontWeight: 600, background: 'rgba(255, 181, 71, 0.1)', padding: '0.125rem 0.5rem', borderRadius: 'var(--radius-full)' }}>
                    {restaurant.cuisine}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Star size={12} fill="#FFB547" color="#FFB547" />
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  {restaurant.rating}
                </span>
              </div>
            </div>

            {restaurant.location && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem' }}>
                <MapPin size={10} color="var(--color-text-muted)" />
                <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>{restaurant.location}</span>
              </div>
            )}

            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: '0.5rem' }}>
              {restaurant.description}
            </p>

            {/* Dietary options */}
            {restaurant.dietaryOptions && restaurant.dietaryOptions.length > 0 && (
              <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                {restaurant.dietaryOptions.map((opt, oi) => (
                  <span key={oi} style={{ fontSize: '0.5625rem', fontWeight: 600, color: 'var(--color-success)', background: 'rgba(61, 220, 132, 0.1)', padding: '0.125rem 0.5rem', borderRadius: 'var(--radius-full)' }}>
                    {opt}
                  </span>
                ))}
              </div>
            )}

            {/* Must Try */}
            {restaurant.mustTry && restaurant.mustTry.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
                <UtensilsCrossed size={10} color="var(--color-primary)" />
                <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>Must try:</span>
                {restaurant.mustTry.map((item, mi) => (
                  <span key={mi} style={{ fontSize: '0.6875rem', color: 'var(--color-primary)', fontWeight: 500 }}>
                    {item}{mi < restaurant.mustTry.length - 1 ? ',' : ''}
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
