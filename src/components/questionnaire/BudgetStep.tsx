'use client';

import StepWrapper from './StepWrapper';
import { useQuestionnaireStore } from '@/hooks/useQuestionnaire';

const currencies = ['INR', 'USD', 'EUR', 'GBP', 'AUD', 'JPY', 'THB'];

const budgetCategories = [
  { key: 'accommodation' as const, label: 'Accommodation', icon: '🏨', color: '#6366F1' },
  { key: 'food' as const, label: 'Food & Dining', icon: '🍽️', color: '#F59E0B' },
  { key: 'activities' as const, label: 'Activities', icon: '🎯', color: '#EC4899' },
  { key: 'shopping' as const, label: 'Shopping', icon: '🛍️', color: '#14B8A6' },
  { key: 'emergency' as const, label: 'Emergency', icon: '🚑', color: '#EF4444' },
];

export default function BudgetStep() {
  const { data, updateBudget } = useQuestionnaireStore();
  const budget = data.budget;

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN').format(amount);
  };

  return (
    <StepWrapper title="Budget" subtitle="Set your total budget and how you'd like to distribute it.">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Currency Selector */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
            Currency
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {currencies.map((c) => (
              <button
                key={c}
                onClick={() => updateBudget({ currency: c })}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${budget.currency === c ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  background: budget.currency === c ? 'rgba(99, 102, 241, 0.08)' : 'var(--color-card)',
                  color: budget.currency === c ? 'var(--color-primary)' : 'var(--color-text-primary)',
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Total Budget Slider */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
            Total Budget
          </label>
          <div
            style={{
              padding: '1.5rem',
              background: 'var(--color-card)',
              border: '2px solid var(--color-border)',
              borderRadius: 'var(--radius-xl)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '1rem' }}>
              {budget.currency} {formatAmount(budget.totalBudget)}
            </div>
            <input
              type="range"
              min="5000"
              max="1000000"
              step="5000"
              value={budget.totalBudget}
              onChange={(e) => updateBudget({ totalBudget: Number(e.target.value) })}
              style={{
                width: '100%',
                height: '6px',
                borderRadius: '3px',
                appearance: 'none',
                background: `linear-gradient(to right, var(--color-primary) ${((budget.totalBudget - 5000) / 995000) * 100}%, var(--color-border) ${((budget.totalBudget - 5000) / 995000) * 100}%)`,
                cursor: 'pointer',
                outline: 'none',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              <span>5,000</span>
              <span>10,00,000</span>
            </div>
          </div>
        </div>

        {/* Budget Distribution */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
            Budget Distribution (%)
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {budgetCategories.map((cat) => (
              <div
                key={cat.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '0.75rem 1rem',
                  background: 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                }}
              >
                <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>{cat.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{cat.label}</span>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: cat.color }}>
                      {budget[cat.key]}% ({budget.currency} {formatAmount(Math.round(budget.totalBudget * budget[cat.key] / 100))})
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="80"
                    step="5"
                    value={budget[cat.key]}
                    onChange={(e) => updateBudget({ [cat.key]: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      height: '4px',
                      borderRadius: '2px',
                      appearance: 'none',
                      background: `linear-gradient(to right, ${cat.color} ${budget[cat.key] * 1.25}%, var(--color-border) ${budget[cat.key] * 1.25}%)`,
                      cursor: 'pointer',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </StepWrapper>
  );
}
