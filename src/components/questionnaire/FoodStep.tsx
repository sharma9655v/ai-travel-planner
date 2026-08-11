'use client';

import StepWrapper from './StepWrapper';
import { useQuestionnaireStore } from '@/hooks/useQuestionnaire';
import type { DietaryPreference } from '@/types/questionnaire';

const diets: { value: DietaryPreference; label: string; icon: string }[] = [
  { value: 'no-restrictions', label: 'No Restrictions', icon: '🍽️' },
  { value: 'vegetarian', label: 'Vegetarian', icon: '🥗' },
  { value: 'vegan', label: 'Vegan', icon: '🌱' },
  { value: 'jain', label: 'Jain', icon: '🥦' },
  { value: 'halal', label: 'Halal', icon: '🥩' },
  { value: 'kosher', label: 'Kosher', icon: '🥖' },
  { value: 'gluten-free', label: 'Gluten-Free', icon: '🌾' },
  { value: 'dairy-free', label: 'Dairy-Free', icon: '🥛' },
  { value: 'seafood', label: 'Seafood', icon: '🐟' },
];

export default function FoodStep() {
  const { data, updateFood } = useQuestionnaireStore();
  const selectedDiets = data.food.dietaryPreferences;

  const toggleDiet = (diet: DietaryPreference) => {
    if (diet === 'no-restrictions') {
      updateFood({ dietaryPreferences: ['no-restrictions'] });
      return;
    }

    let newDiets: DietaryPreference[] = selectedDiets.filter((d) => d !== 'no-restrictions');

    if (newDiets.includes(diet)) {
      newDiets = newDiets.filter((d) => d !== diet);
    } else {
      newDiets = [...newDiets, diet];
    }

    if (newDiets.length === 0) {
      newDiets = ['no-restrictions'];
    }

    updateFood({ dietaryPreferences: newDiets });
  };

  const canProceed = selectedDiets.length > 0;

  return (
    <StepWrapper
      title="Food & Dining"
      subtitle="Any dietary preferences or restrictions? We'll tailor restaurant recommendations for you."
      canProceed={canProceed}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
        {diets.map((diet) => (
          <div
            key={diet.value}
            onClick={() => toggleDiet(diet.value)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '1rem',
              background: 'var(--color-card)',
              border: `2px solid ${selectedDiets.includes(diet.value) ? 'var(--color-primary)' : 'var(--color-border)'}`,
              borderRadius: 'var(--radius-lg)',
              cursor: 'pointer',
              backgroundColor: selectedDiets.includes(diet.value) ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
            }}
          >
            <span style={{ fontSize: '1.5rem' }}>{diet.icon}</span>
            <span style={{ fontSize: '0.9375rem', fontWeight: 500 }}>{diet.label}</span>
          </div>
        ))}
      </div>
    </StepWrapper>
  );
}
