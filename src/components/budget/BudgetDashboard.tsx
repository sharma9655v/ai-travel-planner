'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BedDouble,
  Bus,
  Activity,
  UtensilsCrossed,
  ShoppingBag,
  ShieldAlert,
  Calendar,
  MapPin,
  Wallet,
  Info,
  Sparkles,
} from 'lucide-react';
import type { TravelItinerary } from '@/types/itinerary';
import {
  normalizeBudget,
  CATEGORY_META,
  CATEGORY_ORDER,
  type BudgetCategoryId,
  type CategoryEstimate,
} from '@/lib/budget/normalize';
import { buildSavingsSuggestions } from '@/lib/budget/savings';
import { formatCurrency, formatDate } from '@/lib/utils';
import BudgetPieChart from './BudgetPieChart';
import SavingsSuggestions from './SavingsSuggestions';

const CATEGORY_COLORS: Record<BudgetCategoryId, string> = {
  accommodation: '#B16DFF',
  food: '#FFB547',
  transport: '#70E1FF',
  activities: '#27F2FF',
  shopping: '#FF6B6B',
  emergency: '#3DDC84',
};

const CATEGORY_ICONS: Record<BudgetCategoryId, React.ElementType> = {
  accommodation: BedDouble,
  food: UtensilsCrossed,
  transport: Bus,
  activities: Activity,
  shopping: ShoppingBag,
  emergency: ShieldAlert,
};

const SOURCE_LABELS: Record<string, string> = {
  ai: 'AI estimate',
  derived: 'From your plan',
  none: '—',
};

export default function BudgetDashboard({ itinerary }: { itinerary: TravelItinerary }) {
  const budget = useMemo(() => normalizeBudget(itinerary), [itinerary]);
  const suggestions = useMemo(
    () => buildSavingsSuggestions(itinerary, budget),
    [itinerary, budget]
  );

  const currency = budget.currency;
  const fmt = (amount: number) => formatCurrency(amount, currency);
  const rangeText = (low: number, high: number) => `${fmt(low)} – ${fmt(high)}`;

  const unitLabel = (unit: 'day' | 'night' | 'trip') =>
    unit === 'day' ? 'per day' : unit === 'night' ? 'per night' : 'per trip';

  const unitRangeText = (category: CategoryEstimate) => {
    const { unit } = CATEGORY_META[category.id];
    if (!category.hasData) return null;
    const low = Math.round(category.low / (unit === 'night' ? budget.days : 1));
    const high = Math.round(category.high / (unit === 'night' ? budget.days : 1));
    return `≈ ${rangeText(low, high)} ${unitLabel(unit)}`;
  };

  const summary = itinerary.tripSummary;

  return (
    <>
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          position: 'relative',
          padding: '2rem 1.5rem',
          borderRadius: 'var(--radius-2xl)',
          background: 'linear-gradient(135deg, rgba(61, 220, 132, 0.08) 0%, rgba(39, 242, 255, 0.08) 100%)',
          overflow: 'hidden',
          marginBottom: '1.5rem',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(61, 220, 132, 0.1) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Sparkles size={16} color="var(--color-success)" />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-success)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Budget Planner
            </span>
          </div>

          <h1 style={{ fontSize: 'clamp(1.5rem, 4.5vw, 2.125rem)', fontWeight: 800, marginBottom: '0.75rem' }}>
            <span className="gradient-text">{summary.destination}</span> Budget
          </h1>

          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.5rem' }}>
            <Badge icon={<Calendar size={14} />} text={`${formatDate(summary.startDate)} — ${formatDate(summary.endDate)}`} />
            <Badge icon={<MapPin size={14} />} text={`${budget.days} Days`} />
            <Badge icon={<Wallet size={14} />} text={currency} />
          </div>
        </div>
      </motion.div>

      {/* Total + Daily */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '2rem' }}>
        <SummaryCard
          label="Estimated Trip Total"
          value={rangeText(budget.total.low, budget.total.high)}
          hint={`${budget.days}-day trip`}
          accent="var(--color-primary)"
        />
        <SummaryCard
          label="Estimated Daily Spend"
          value={rangeText(budget.daily.low, budget.daily.high)}
          hint="per day"
          accent="var(--color-success)"
        />
      </div>

      {/* Spending Snapshot */}
      <div style={{ marginBottom: '2rem' }}>
        <SectionHeader title="Spending Snapshot" color="var(--color-primary)" />
        <div className="glass-card-static" style={{ padding: '1.5rem 1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', alignItems: 'center' }}>
            <BudgetPieChart
              segments={CATEGORY_ORDER.filter((id) => budget.categories.find((c) => c.id === id)?.hasData).map(
                (id) => {
                  const category = budget.categories.find((c) => c.id === id) as CategoryEstimate;
                  return { label: CATEGORY_META[id].label, share: category.share, color: CATEGORY_COLORS[id] };
                }
              )}
              centerLabel="Estimated total"
              centerValue={budget.total.low > 0 ? rangeText(budget.total.low, budget.total.high) : '—'}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {CATEGORY_ORDER.map((id) => {
                const category = budget.categories.find((c) => c.id === id) as CategoryEstimate;
                return (
                  <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: CATEGORY_COLORS[id], flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                      {CATEGORY_META[id].label}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      {category.hasData ? `${category.share}%` : '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Budget Breakdown */}
      <div style={{ marginBottom: '0.5rem' }}>
        <SectionHeader title="Budget Breakdown" color="var(--color-primary)" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {CATEGORY_ORDER.map((id, i) => {
            const category = budget.categories.find((c) => c.id === id) as CategoryEstimate;
            const Icon = CATEGORY_ICONS[id];
            const color = CATEGORY_COLORS[id];
            const { unit } = CATEGORY_META[id];
            return (
              <motion.div
                key={id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card-static"
                style={{ padding: '0.875rem 1rem', borderRadius: 'var(--radius-lg)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 'var(--radius-md)',
                      background: `${color}14`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={15} color={color} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                        {CATEGORY_META[id].label}
                      </span>
                      <span
                        style={{
                          padding: '0.1rem 0.45rem',
                          borderRadius: 'var(--radius-full)',
                          background: `${color}12`,
                          border: `1px solid ${color}30`,
                          color,
                          fontSize: '0.5625rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {SOURCE_LABELS[category.source]}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', marginTop: '0.125rem' }}>
                      {unitRangeText(category) ?? 'No estimate available'}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      {category.hasData ? rangeText(category.low, category.high) : '—'}
                    </div>
                    <div style={{ fontSize: '0.5625rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {unitLabel(unit)}
                    </div>
                  </div>
                </div>

                {/* Share bar */}
                <div
                  style={{
                    height: 5,
                    borderRadius: 3,
                    background: 'rgba(255, 255, 255, 0.06)',
                    marginTop: '0.625rem',
                    overflow: 'hidden',
                  }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${category.share}%` }}
                    transition={{ duration: 0.7, delay: 0.15 + i * 0.05, ease: 'easeOut' }}
                    style={{ height: '100%', borderRadius: 3, background: color }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Savings Suggestions */}
      <SavingsSuggestions suggestions={suggestions} currency={currency} />

      {/* Disclosure */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.5rem',
          marginTop: '2rem',
          padding: '0.75rem 1rem',
          background: 'rgba(39, 242, 255, 0.06)',
          border: '1px solid rgba(39, 242, 255, 0.18)',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <Info size={13} color="var(--color-primary)" style={{ marginTop: 2, flexShrink: 0 }} />
        <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
          Estimated ranges only — rough approximations for planning reference, never live, binding, or
          real-time prices. This planner never books or accepts payments.
        </span>
      </div>
    </>
  );
}

function SectionHeader({ title, color }: { title: string; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
      <div style={{ width: 4, height: 16, borderRadius: 2, background: color }} />
      <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{title}</h3>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint: string;
  accent: string;
}) {
  return (
    <div
      className="glass-card-static"
      style={{
        padding: '1.25rem 1rem',
        borderRadius: 'var(--radius-xl)',
        textAlign: 'center',
        border: `1px solid ${accent}26`,
      }}
    >
      <div
        style={{
          fontSize: '0.625rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'var(--color-text-muted)',
          marginBottom: '0.375rem',
          fontWeight: 500,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: '1.125rem', fontWeight: 800, color: accent }}>{value}</div>
      <div style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
        {hint} · approx.
      </div>
    </div>
  );
}

function Badge({ icon, text }: { icon: React.ReactNode; text: string }) {
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
