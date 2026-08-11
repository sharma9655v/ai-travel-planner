'use client';

import { useState } from 'react';
import { Edit2, Loader2 } from 'lucide-react';
import StepWrapper from './StepWrapper';
import { useQuestionnaireStore } from '@/hooks/useQuestionnaire';
import { createItineraryId } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function ReviewStep() {
  const { data, goToStep, isGenerating, setGenerating, setGeneratedId } = useQuestionnaireStore();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setError(null);
    setGenerating(true);
    try {
      // Generate a client-side ID that matches what we'll tell the itinerary page
      const tempId = createItineraryId();
      setGeneratedId(tempId);

      // Navigate immediately — the itinerary page will handle the actual API call
      router.push(`/itinerary/${tempId}`);
    } catch (err) {
      console.error(err);
      setError("Couldn't start generation. Please try again.");
      setGenerating(false);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN').format(amount);
  };

  return (
    <StepWrapper
      title="Review Your Trip"
      subtitle="Almost there! Review your details before our AI works its magic."
      hideNext
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <ReviewSection
          title="Trip Details"
          onEdit={() => goToStep(1)}
          content={`${data.tripDetails.startingLocation} → ${data.tripDetails.destination}\n${data.tripDetails.departureDate} to ${data.tripDetails.returnDate} ${data.tripDetails.flexibleDates ? '(Flexible)' : ''}`}
        />

        <ReviewSection
          title="Travelers"
          onEdit={() => goToStep(2)}
          content={`${data.travelers.tripType.charAt(0).toUpperCase() + data.travelers.tripType.slice(1)} • ${data.travelers.groupSize} People\n${data.travelers.children > 0 ? `${data.travelers.children} Children • ` : ''}${data.travelers.seniors > 0 ? `${data.travelers.seniors} Seniors • ` : ''}${data.travelers.pets ? 'With Pets' : 'No Pets'}`}
        />

        <ReviewSection
          title="Budget"
          onEdit={() => goToStep(3)}
          content={`${data.budget.currency} ${formatAmount(data.budget.totalBudget)}\nAccomm: ${data.budget.accommodation}% • Food: ${data.budget.food}% • Activity: ${data.budget.activities}%`}
        />

        <ReviewSection
          title="Transport & Accommodation"
          onEdit={() => goToStep(4)}
          content={`Transport: ${data.transport.modes.join(', ') || 'Not set'}\nStays: ${data.accommodation.types.join(', ') || 'Not set'} (${data.accommodation.starRating}★+)`}
        />

        <ReviewSection
          title="Food & Dietary"
          onEdit={() => goToStep(6)}
          content={`Diet: ${data.food.dietaryPreferences.join(', ') || 'No restrictions'}`}
        />

        <ReviewSection
          title="Interests & Style"
          onEdit={() => goToStep(7)}
          content={`Interests: ${data.interests.interests.slice(0, 4).join(', ')}${data.interests.interests.length > 4 ? ` +${data.interests.interests.length - 4} more` : ''}\nStyle: ${data.style.travelStyle} • Pace: ${data.style.travelPace}`}
        />
      </div>

      <div style={{ marginTop: '3rem', textAlign: 'center' }}>
        {error && (
          <div
            style={{
              marginBottom: '0.75rem',
              padding: '0.625rem 0.875rem',
              background: 'rgba(255, 107, 107, 0.1)',
              border: '1px solid rgba(255, 107, 107, 0.3)',
              borderRadius: 'var(--radius-lg)',
              fontSize: '0.75rem',
              color: '#FF6B6B',
            }}
          >
            {error}
          </div>
        )}
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="btn-primary"
          style={{
            width: '100%',
            padding: '1.125rem',
            fontSize: '1.125rem',
            boxShadow: '0 8px 25px rgba(99, 102, 241, 0.4)',
          }}
        >
          {isGenerating ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
              <Loader2 className="animate-spin" size={20} />
              Preparing...
            </span>
          ) : (
            'Generate My Itinerary ✨'
          )}
        </button>
        <p style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          Takes 15-30 seconds • Powered by AI
        </p>
      </div>
    </StepWrapper>
  );
}

function ReviewSection({ title, content, onEdit }: { title: string; content: string; onEdit: () => void }) {
  return (
    <div
      style={{
        padding: '1.25rem',
        background: 'var(--color-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>{title}</h4>
        <button
          onClick={onEdit}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-primary)',
            cursor: 'pointer',
            padding: '0.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            fontSize: '0.75rem',
            fontWeight: 600,
          }}
        >
          <Edit2 size={14} /> Edit
        </button>
      </div>
      <div style={{ fontSize: '0.9375rem', color: 'var(--color-text-primary)', whiteSpace: 'pre-line', lineHeight: 1.5 }}>
        {content}
      </div>
    </div>
  );
}
