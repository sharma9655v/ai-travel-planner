'use client';

import StepWrapper from './StepWrapper';
import { useQuestionnaireStore } from '@/hooks/useQuestionnaire';
import type { Interest } from '@/types/questionnaire';

const allInterests: { value: Interest; label: string; image: string }[] = [
  { value: 'adventure', label: 'Adventure', image: '🏔️' },
  { value: 'mountains', label: 'Mountains', image: '⛰️' },
  { value: 'beaches', label: 'Beaches', image: '🏖️' },
  { value: 'hiking', label: 'Hiking', image: '🥾' },
  { value: 'wildlife', label: 'Wildlife', image: '🦁' },
  { value: 'museums', label: 'Museums', image: '🏛️' },
  { value: 'historical', label: 'Historical Sites', image: '🏰' },
  { value: 'shopping', label: 'Shopping', image: '🛍️' },
  { value: 'nightlife', label: 'Nightlife', image: '🍸' },
  { value: 'cafes', label: 'Cafés', image: '☕' },
  { value: 'photography', label: 'Photography', image: '📸' },
  { value: 'festivals', label: 'Festivals', image: '🎪' },
  { value: 'local-culture', label: 'Local Culture', image: '🎭' },
  { value: 'hidden-gems', label: 'Hidden Gems', image: '💎' },
  { value: 'luxury', label: 'Luxury Experiences', image: '✨' },
  { value: 'wellness', label: 'Wellness & Spa', image: '🧘‍♀️' },
  { value: 'cruises', label: 'Cruises', image: '🛳️' },
  { value: 'water-sports', label: 'Water Sports', image: '🏄‍♂️' },
  { value: 'theme-parks', label: 'Theme Parks', image: '🎢' },
];

export default function InterestsStep() {
  const { data, updateInterests } = useQuestionnaireStore();
  const selectedInterests = data.interests.interests;

  const toggleInterest = (interest: Interest) => {
    if (selectedInterests.includes(interest)) {
      updateInterests({ interests: selectedInterests.filter((i) => i !== interest) });
    } else {
      updateInterests({ interests: [...selectedInterests, interest] });
    }
  };

  const canProceed = selectedInterests.length > 0;

  return (
    <StepWrapper
      title="Interests"
      subtitle="What do you want to see and do? Pick as many as you like."
      canProceed={canProceed}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '1rem' }}>
        {allInterests.map((interest) => (
          <div
            key={interest.value}
            onClick={() => toggleInterest(interest.value)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '1.25rem 0.5rem',
              background: 'var(--color-card)',
              border: `2px solid ${selectedInterests.includes(interest.value) ? 'var(--color-primary)' : 'var(--color-border)'}`,
              borderRadius: 'var(--radius-xl)',
              cursor: 'pointer',
              textAlign: 'center',
              backgroundColor: selectedInterests.includes(interest.value) ? 'rgba(99, 102, 241, 0.08)' : 'var(--color-card)',
              transition: 'all 0.2s ease',
            }}
            className="hover:-translate-y-1 hover:shadow-md"
          >
            <span style={{ fontSize: '2.5rem', lineHeight: 1 }}>{interest.image}</span>
            <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>{interest.label}</span>
          </div>
        ))}
      </div>
    </StepWrapper>
  );
}
