'use client';

import { MapPin, Calendar, ToggleLeft, ToggleRight } from 'lucide-react';
import StepWrapper from './StepWrapper';
import { useQuestionnaireStore } from '@/hooks/useQuestionnaire';

export default function TripDetailsStep() {
  const { data, updateTripDetails } = useQuestionnaireStore();
  const { startingLocation, destination, departureDate, returnDate, flexibleDates } = data.tripDetails;

  const canProceed = startingLocation.trim() !== '' && destination.trim() !== '' && departureDate !== '' && returnDate !== '';

  return (
    <StepWrapper
      title="Trip Details"
      subtitle="Where are you going and when? Let's start with the basics."
      canProceed={canProceed}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Starting Location */}
        <InputField
          icon={<MapPin size={18} />}
          label="Starting Location"
          placeholder="e.g., New Delhi, Mumbai, London"
          value={startingLocation}
          onChange={(val) => updateTripDetails({ startingLocation: val })}
        />

        {/* Destination */}
        <InputField
          icon={<MapPin size={18} />}
          label="Destination"
          placeholder="e.g., Goa, Bali, Paris, Tokyo"
          value={destination}
          onChange={(val) => updateTripDetails({ destination: val })}
        />

        {/* Dates */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <InputField
            icon={<Calendar size={18} />}
            label="Departure Date"
            type="date"
            value={departureDate}
            onChange={(val) => updateTripDetails({ departureDate: val })}
          />
          <InputField
            icon={<Calendar size={18} />}
            label="Return Date"
            type="date"
            value={returnDate}
            onChange={(val) => updateTripDetails({ returnDate: val })}
          />
        </div>

        {/* Flexible Dates */}
        <button
          type="button"
          role="switch"
          aria-checked={flexibleDates}
          aria-label="Flexible dates — AI can suggest better dates based on weather and events"
          onClick={() => updateTripDetails({ flexibleDates: !flexibleDates })}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1rem 1.25rem',
            background: 'var(--color-card)',
            border: `2px solid ${flexibleDates ? 'var(--color-primary)' : 'var(--color-border)'}`,
            borderRadius: 'var(--radius-lg)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontFamily: 'inherit',
            textAlign: 'left',
            color: 'inherit',
            width: '100%',
          }}
        >
          {flexibleDates ? (
            <ToggleRight size={24} color="var(--color-primary)" />
          ) : (
            <ToggleLeft size={24} color="var(--color-text-muted)" />
          )}
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Flexible Dates</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
              AI can suggest better dates based on weather and events
            </div>
          </div>
        </button>
      </div>
    </StepWrapper>
  );
}

function InputField({
  icon,
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
}: {
  icon: React.ReactNode;
  label: string;
  placeholder?: string;
  value: string;
  onChange: (val: string) => void;
  type?: string;
}) {
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return (
    <div>
      <label
        htmlFor={id}
        style={{
          display: 'block',
          fontSize: '0.8125rem',
          fontWeight: 600,
          color: 'var(--color-text-secondary)',
          marginBottom: '0.5rem',
        }}
      >
        {label}
      </label>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.75rem 1rem',
          background: 'var(--color-card)',
          border: '2px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          transition: 'border-color 0.2s ease',
        }}
      >
        <span style={{ color: 'var(--color-text-muted)', flexShrink: 0 }}>{icon}</span>
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '100%',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: '0.9375rem',
            color: 'var(--color-text-primary)',
            fontFamily: 'inherit',
          }}
        />
      </div>
    </div>
  );
}
