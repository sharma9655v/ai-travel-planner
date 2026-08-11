'use client';

import { Building, Tent, Home, Star } from 'lucide-react';
import StepWrapper from './StepWrapper';
import { useQuestionnaireStore } from '@/hooks/useQuestionnaire';
import type { AccommodationType, AccommodationAmenity } from '@/types/questionnaire';

const accommodationTypes: { value: AccommodationType; icon: React.ReactNode; label: string }[] = [
  { value: 'hotel', icon: <Building size={24} />, label: 'Hotel' },
  { value: 'hostel', icon: <Building size={24} />, label: 'Hostel' },
  { value: 'airbnb', icon: <Home size={24} />, label: 'Airbnb / Apt' },
  { value: 'resort', icon: <Building size={24} />, label: 'Resort' },
  { value: 'homestay', icon: <Home size={24} />, label: 'Homestay' },
  { value: 'camping', icon: <Tent size={24} />, label: 'Camping' },
];

const amenitiesList: { value: AccommodationAmenity; label: string; icon: string }[] = [
  { value: 'wifi', label: 'Free Wi-Fi', icon: '📶' },
  { value: 'pool', label: 'Swimming Pool', icon: '🏊' },
  { value: 'parking', label: 'Parking', icon: '🅿️' },
  { value: 'gym', label: 'Fitness Center', icon: '🏋️' },
  { value: 'pet-friendly', label: 'Pet Friendly', icon: '🐾' },
  { value: 'wheelchair-accessible', label: 'Accessible', icon: '♿' },
];

export default function AccommodationStep() {
  const { data, updateAccommodation } = useQuestionnaireStore();
  const { types, starRating, amenities } = data.accommodation;

  const toggleType = (type: AccommodationType) => {
    if (types.includes(type)) {
      updateAccommodation({ types: types.filter((t) => t !== type) });
    } else {
      updateAccommodation({ types: [...types, type] });
    }
  };

  const toggleAmenity = (amenity: AccommodationAmenity) => {
    if (amenities.includes(amenity)) {
      updateAccommodation({ amenities: amenities.filter((a) => a !== amenity) });
    } else {
      updateAccommodation({ amenities: [...amenities, amenity] });
    }
  };

  const canProceed = types.length > 0;

  return (
    <StepWrapper
      title="Accommodation"
      subtitle="Where would you like to stay? Select your preferred accommodation types."
      canProceed={canProceed}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Accommodation Types */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
            Property Type (Select multiple)
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '1rem' }}>
            {accommodationTypes.map((type) => (
              <div
                key={type.value}
                onClick={() => toggleType(type.value)}
                style={{
                  padding: '1rem',
                  background: 'var(--color-card)',
                  border: `2px solid ${types.includes(type.value) ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius-lg)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  backgroundColor: types.includes(type.value) ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem', color: types.includes(type.value) ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}>
                  {type.icon}
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{type.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Star Rating */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
            Minimum Star Rating
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                onClick={() => updateAccommodation({ starRating: rating })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.5rem 1rem',
                  background: 'var(--color-card)',
                  border: `1px solid ${starRating >= rating ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius-md)',
                  color: starRating >= rating ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  cursor: 'pointer',
                }}
              >
                {rating} <Star size={16} fill={starRating >= rating ? 'currentColor' : 'none'} />
              </button>
            ))}
          </div>
        </div>

        {/* Amenities */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
            Required Amenities
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {amenitiesList.map((amenity) => (
              <button
                key={amenity.value}
                onClick={() => toggleAmenity(amenity.value)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  background: amenities.includes(amenity.value) ? 'rgba(99, 102, 241, 0.1)' : 'var(--color-card)',
                  border: `1px solid ${amenities.includes(amenity.value) ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.875rem',
                  color: 'var(--color-text-primary)',
                  cursor: 'pointer',
                }}
              >
                <span>{amenity.icon}</span> {amenity.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </StepWrapper>
  );
}
