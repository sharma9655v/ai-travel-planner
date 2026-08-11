'use client';

import { Minus, Plus } from 'lucide-react';
import StepWrapper from './StepWrapper';
import { useQuestionnaireStore } from '@/hooks/useQuestionnaire';
import type { TripType } from '@/types/questionnaire';

const tripTypes: { value: TripType; icon: string; label: string }[] = [
  { value: 'solo', icon: '🧳', label: 'Solo' },
  { value: 'couple', icon: '💑', label: 'Couple' },
  { value: 'family', icon: '👨‍👩‍👧‍👦', label: 'Family' },
  { value: 'friends', icon: '👯', label: 'Friends' },
  { value: 'business', icon: '💼', label: 'Business' },
  { value: 'honeymoon', icon: '💍', label: 'Honeymoon' },
];

export default function TravelersStep() {
  const { data, updateTravelers } = useQuestionnaireStore();
  const { tripType, groupSize, children, seniors, pets } = data.travelers;

  return (
    <StepWrapper title="Travelers" subtitle="Who's joining the adventure? Tell us about your travel group.">
      {/* Trip Type Selection */}
      <div style={{ marginBottom: '2rem' }}>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
          Trip Type
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem' }}>
          {tripTypes.map((type) => (
            <div
              key={type.value}
              onClick={() => updateTravelers({ tripType: type.value })}
              className={`selection-card ${tripType === type.value ? 'selected' : ''}`}
            >
              <span className="icon">{type.icon}</span>
              <span className="label">{type.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Counters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <CounterField
          label="Group Size"
          sublabel="Total number of travelers"
          value={groupSize}
          min={1}
          max={20}
          onChange={(val) => updateTravelers({ groupSize: val })}
        />
        <CounterField
          label="Children"
          sublabel="Under 12 years old"
          value={children}
          min={0}
          max={10}
          onChange={(val) => updateTravelers({ children: val })}
        />
        <CounterField
          label="Senior Citizens"
          sublabel="Above 60 years old"
          value={seniors}
          min={0}
          max={10}
          onChange={(val) => updateTravelers({ seniors: val })}
        />

        {/* Pets Toggle */}
        <div
          onClick={() => updateTravelers({ pets: !pets })}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.25rem',
            background: 'var(--color-card)',
            border: `2px solid ${pets ? 'var(--color-primary)' : 'var(--color-border)'}`,
            borderRadius: 'var(--radius-lg)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.25rem' }}>🐾</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Traveling with Pets</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>AI will find pet-friendly options</div>
            </div>
          </div>
          <div
            style={{
              width: 44,
              height: 24,
              borderRadius: 'var(--radius-full)',
              background: pets ? 'var(--color-primary)' : 'var(--color-border)',
              position: 'relative',
              transition: 'background 0.2s ease',
            }}
          >
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: 'white',
                position: 'absolute',
                top: 3,
                left: pets ? 23 : 3,
                transition: 'left 0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }}
            />
          </div>
        </div>
      </div>
    </StepWrapper>
  );
}

function CounterField({
  label,
  sublabel,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  sublabel: string;
  value: number;
  min: number;
  max: number;
  onChange: (val: number) => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem 1.25rem',
        background: 'var(--color-card)',
        border: '2px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <div>
        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{label}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{sublabel}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          style={{
            width: 32,
            height: 32,
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            background: 'var(--color-bg)',
            cursor: value <= min ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-text-primary)',
            opacity: value <= min ? 0.4 : 1,
          }}
        >
          <Minus size={14} />
        </button>
        <span style={{ fontWeight: 700, fontSize: '1.125rem', minWidth: '2rem', textAlign: 'center' }}>
          {value}
        </span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          style={{
            width: 32,
            height: 32,
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            background: 'var(--color-bg)',
            cursor: value >= max ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-text-primary)',
            opacity: value >= max ? 0.4 : 1,
          }}
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}
