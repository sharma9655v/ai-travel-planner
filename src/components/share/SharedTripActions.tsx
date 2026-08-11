'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, Loader2, Pencil } from 'lucide-react';
import type { TravelItinerary } from '@/types/itinerary';
import { defaultQuestionnaireData } from '@/types/questionnaire';
import { createItineraryId } from '@/lib/utils';
import { useItinerariesStore } from '@/hooks/useItineraries';

interface SharedTripActionsProps {
  mode: 'view' | 'edit';
  itinerary: TravelItinerary;
}

// Interactive actions on the public shared trip page.
// Editable links never mutate the shared copy — they clone it into the
// visitor's own planner, where they can edit freely.
export default function SharedTripActions({ mode, itinerary }: SharedTripActionsProps) {
  const router = useRouter();
  const saveItinerary = useItinerariesStore((s) => s.saveItinerary);
  const [busy, setBusy] = useState(false);

  const importCopy = () => {
    if (busy) return;
    setBusy(true);
    const id = createItineraryId();
    const now = new Date().toISOString();
    const { tripSummary } = itinerary;

    const questionnaireData = {
      ...defaultQuestionnaireData,
      tripDetails: {
        ...defaultQuestionnaireData.tripDetails,
        startingLocation: '',
        destination: tripSummary.destination,
        departureDate: tripSummary.startDate,
        returnDate: tripSummary.endDate,
        flexibleDates: false,
      },
      budget: {
        ...defaultQuestionnaireData.budget,
        currency: tripSummary.currency,
        totalBudget: itinerary.budgetBreakdown.totalBudget || defaultQuestionnaireData.budget.totalBudget,
      },
    };

    saveItinerary(id, {
      id,
      itinerary,
      questionnaireData,
      createdAt: now,
      updatedAt: now,
    });

    router.push(`/itinerary/${id}`);
  };

  if (mode === 'view') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          padding: '0.8rem 1rem',
          borderRadius: 'var(--radius-lg)',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.07)',
          fontSize: '0.75rem',
          color: 'var(--color-text-secondary)',
        }}
      >
        <Copy size={14} color="var(--color-primary)" />
        Read-only link — this trip cannot be changed here.
      </div>
    );
  }

  return (
    <button
      onClick={importCopy}
      disabled={busy}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        padding: '0.9rem 1rem',
        borderRadius: 'var(--radius-lg)',
        background: 'linear-gradient(135deg, rgba(39, 242, 255, 0.16), rgba(177, 109, 255, 0.16))',
        border: '1px solid rgba(39, 242, 255, 0.35)',
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontWeight: 800,
        fontSize: '0.8125rem',
        color: 'var(--color-text-primary)',
      }}
    >
      {busy ? <Loader2 size={16} className="spin" /> : <Pencil size={16} color="var(--color-primary)" />}
      {busy ? 'Copying…' : 'Edit a copy in my planner'}
    </button>
  );
}
