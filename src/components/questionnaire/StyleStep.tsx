'use client';

import { DollarSign, Zap, Coffee, Activity } from 'lucide-react';
import StepWrapper from './StepWrapper';
import { useQuestionnaireStore } from '@/hooks/useQuestionnaire';
import type { TravelStyle, TravelPace } from '@/types/questionnaire';

const styles: { value: TravelStyle; label: string; description: string; icon: React.ReactNode }[] = [
  { value: 'budget', label: 'Budget-Friendly', description: 'Hostels, street food, and free attractions', icon: <DollarSign size={24} /> },
  { value: 'mid-range', label: 'Mid-Range', description: 'Comfortable hotels and balanced dining', icon: <span style={{ display: 'flex' }}><DollarSign size={20} /><DollarSign size={20} /></span> },
  { value: 'luxury', label: 'Luxury', description: '5-star resorts, fine dining, and premium experiences', icon: <span style={{ display: 'flex' }}><DollarSign size={18} /><DollarSign size={18} /><DollarSign size={18} /></span> },
];

const paces: { value: TravelPace; label: string; description: string; icon: React.ReactNode }[] = [
  { value: 'relaxed', label: 'Relaxed', description: 'Slow mornings, 1-2 activities per day, lots of free time', icon: <Coffee size={24} /> },
  { value: 'balanced', label: 'Balanced', description: 'Good mix of activities and downtime', icon: <Activity size={24} /> },
  { value: 'fast', label: 'Fast-Paced', description: 'Action-packed, maximizing every hour to see everything', icon: <Zap size={24} /> },
];

export default function StyleStep() {
  const { data, updateStyle } = useQuestionnaireStore();
  const { travelStyle, travelPace } = data.style;

  return (
    <StepWrapper title="Travel Style" subtitle="How do you want to experience your trip?">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Style */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
            Trip Style
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {styles.map((style) => (
              <div
                key={style.value}
                onClick={() => updateStyle({ travelStyle: style.value })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1.25rem',
                  background: travelStyle === style.value ? 'rgba(99, 102, 241, 0.05)' : 'var(--color-card)',
                  border: `2px solid ${travelStyle === style.value ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius-lg)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ color: travelStyle === style.value ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}>
                  {style.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--color-text-primary)' }}>{style.label}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>{style.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pace */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
            Travel Pace
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {paces.map((pace) => (
              <div
                key={pace.value}
                onClick={() => updateStyle({ travelPace: pace.value })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1.25rem',
                  background: travelPace === pace.value ? 'rgba(236, 72, 153, 0.05)' : 'var(--color-card)',
                  border: `2px solid ${travelPace === pace.value ? 'var(--color-secondary)' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius-lg)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ color: travelPace === pace.value ? 'var(--color-secondary)' : 'var(--color-text-secondary)' }}>
                  {pace.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--color-text-primary)' }}>{pace.label}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>{pace.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </StepWrapper>
  );
}
