'use client';

import { Plane, Train, Bus, Car, Bike, Navigation } from 'lucide-react';
import StepWrapper from './StepWrapper';
import { useQuestionnaireStore } from '@/hooks/useQuestionnaire';
import type { TransportMode } from '@/types/questionnaire';

const transportModes: { value: TransportMode; icon: React.ReactNode; label: string; description: string }[] = [
  { value: 'flight', icon: <Plane size={24} />, label: 'Flight', description: 'Fastest for long distances' },
  { value: 'train', icon: <Train size={24} />, label: 'Train', description: 'Scenic and comfortable' },
  { value: 'bus', icon: <Bus size={24} />, label: 'Bus', description: 'Budget-friendly option' },
  { value: 'rental-car', icon: <Car size={24} />, label: 'Rental Car', description: 'Maximum flexibility' },
  { value: 'self-drive', icon: <Car size={24} />, label: 'Self Drive', description: 'Using your own vehicle' },
  { value: 'bike', icon: <Bike size={24} />, label: 'Bike/Scooter', description: 'Great for local exploration' },
  { value: 'mixed', icon: <Navigation size={24} />, label: 'Mixed', description: 'Whatever makes sense' },
];

export default function TransportStep() {
  const { data, updateTransport } = useQuestionnaireStore();
  const selectedModes = data.transport.modes;

  const toggleMode = (mode: TransportMode) => {
    if (selectedModes.includes(mode)) {
      updateTransport({ modes: selectedModes.filter((m) => m !== mode) });
    } else {
      updateTransport({ modes: [...selectedModes, mode] });
    }
  };

  const canProceed = selectedModes.length > 0;

  return (
    <StepWrapper
      title="Transportation"
      subtitle="How do you prefer to get around? Select all that apply."
      canProceed={canProceed}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>
        {transportModes.map((mode) => (
          <div
            key={mode.value}
            onClick={() => toggleMode(mode.value)}
            style={{
              padding: '1.25rem 1rem',
              background: 'var(--color-card)',
              border: `2px solid ${selectedModes.includes(mode.value) ? 'var(--color-primary)' : 'var(--color-border)'}`,
              borderRadius: 'var(--radius-xl)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'center',
              boxShadow: selectedModes.includes(mode.value) ? '0 0 0 2px rgba(99, 102, 241, 0.15)' : 'none',
              backgroundColor: selectedModes.includes(mode.value) ? 'rgba(99, 102, 241, 0.05)' : 'var(--color-card)',
            }}
            className="hover:shadow-md hover:-translate-y-1"
          >
            <div
              style={{
                width: 48,
                height: 48,
                margin: '0 auto 1rem',
                borderRadius: '50%',
                background: selectedModes.includes(mode.value) ? 'var(--color-primary)' : 'var(--color-bg)',
                color: selectedModes.includes(mode.value) ? 'white' : 'var(--color-text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
            >
              {mode.icon}
            </div>
            <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: '0.25rem', color: 'var(--color-text-primary)' }}>
              {mode.label}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
              {mode.description}
            </div>
          </div>
        ))}
      </div>
    </StepWrapper>
  );
}
