'use client';

import { motion } from 'framer-motion';
import { PiggyBank } from 'lucide-react';
import type { SavingsSuggestion } from '@/lib/budget/savings';
import { formatCurrency } from '@/lib/utils';

export default function SavingsSuggestions({
  suggestions,
  currency,
}: {
  suggestions: SavingsSuggestion[];
  currency: string;
}) {
  if (suggestions.length === 0) return null;

  return (
    <div style={{ marginTop: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <div style={{ width: 4, height: 16, borderRadius: 2, background: 'var(--color-success)' }} />
        <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Savings Suggestions</h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {suggestions.map((suggestion, i) => (
          <motion.div
            key={suggestion.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card-static"
            style={{ padding: '0.875rem 1rem', borderRadius: 'var(--radius-lg)' }}
          >
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(61, 220, 132, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <PiggyBank size={15} color="var(--color-success)" />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    {suggestion.title}
                  </span>
                  <span
                    style={{
                      padding: '0.1rem 0.5rem',
                      borderRadius: 'var(--radius-full)',
                      background: 'rgba(61, 220, 132, 0.1)',
                      border: '1px solid rgba(61, 220, 132, 0.25)',
                      color: 'var(--color-success)',
                      fontSize: '0.5625rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {suggestion.tag}
                  </span>
                </div>

                <p
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--color-text-secondary)',
                    lineHeight: 1.55,
                    marginTop: '0.25rem',
                  }}
                >
                  {suggestion.detail}
                </p>

                {suggestion.range && (
                  <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-success)' }}>
                    Potential saving ≈{' '}
                    {formatCurrency(suggestion.range.low, currency)} –{' '}
                    {formatCurrency(suggestion.range.high, currency)}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
