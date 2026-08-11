'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createItineraryId } from '@/lib/utils';
import { useQuestionnaireStore } from '@/hooks/useQuestionnaire';
import type { TripType } from '@/types/questionnaire';

// ============================================================
// Quick Plan Data — the 7 fields from the n8n workflow form
// ============================================================

export interface QuickPlanData {
  email: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: string;
  travelers: string;
  interests: string;
}

export const defaultQuickPlanData: QuickPlanData = {
  email: '',
  destination: '',
  startDate: '',
  endDate: '',
  budget: '',
  travelers: '',
  interests: '',
};

// ============================================================
// Hook — maps simple form → QuestionnaireData → generate flow
// ============================================================

export function useQuickPlan() {
  const [formData, setFormData] = useState<QuickPlanData>(defaultQuickPlanData);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const updateField = <K extends keyof QuickPlanData>(
    field: K,
    value: QuickPlanData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Parse the "travelers" free text into a group size number
  const parseGroupSize = (text: string): number => {
    const match = text.match(/(\d+)/);
    return match ? Math.max(1, parseInt(match[1], 10)) : 1;
  };

  // Parse the "budget" free text into a numeric budget & guess the currency
  const parseBudget = (
    text: string
  ): { amount: number; currency: string } => {
    // Look for currency symbols first
    if (text.includes('₹') || text.toLowerCase().includes('inr')) {
      const match = text.match(/[\d,]+/);
      return {
        amount: match ? parseInt(match[0].replace(/,/g, ''), 10) : 50000,
        currency: 'INR',
      };
    }
    if (text.includes('€') || text.toLowerCase().includes('eur')) {
      const match = text.match(/[\d,]+/);
      return {
        amount: match ? parseInt(match[0].replace(/,/g, ''), 10) : 2000,
        currency: 'EUR',
      };
    }
    if (text.includes('£') || text.toLowerCase().includes('gbp')) {
      const match = text.match(/[\d,]+/);
      return {
        amount: match ? parseInt(match[0].replace(/,/g, ''), 10) : 2000,
        currency: 'GBP',
      };
    }
    // Default to USD
    const match = text.match(/[\d,]+/);
    return {
      amount: match ? parseInt(match[0].replace(/,/g, ''), 10) : 2000,
      currency: 'USD',
    };
  };

  // Parse interests CSV into array
  const parseInterests = (text: string): string[] => {
    return text
      .split(/[,;]+/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  };

  // Map to existing Interest type values (best-effort matching)
  const mapInterests = (interests: string[]) => {
    type Interest = 'adventure' | 'mountains' | 'beaches' | 'hiking' | 'wildlife' |
      'museums' | 'historical' | 'shopping' | 'nightlife' | 'cafes' | 'photography' |
      'festivals' | 'local-culture' | 'hidden-gems' | 'luxury' | 'wellness' |
      'cruises' | 'water-sports' | 'theme-parks';

    const mapping: Record<string, Interest> = {
      adventure: 'adventure',
      mountains: 'mountains',
      mountain: 'mountains',
      beach: 'beaches',
      beaches: 'beaches',
      hiking: 'hiking',
      trekking: 'hiking',
      wildlife: 'wildlife',
      nature: 'wildlife',
      museum: 'museums',
      museums: 'museums',
      art: 'museums',
      history: 'historical',
      historical: 'historical',
      heritage: 'historical',
      shopping: 'shopping',
      nightlife: 'nightlife',
      'night life': 'nightlife',
      party: 'nightlife',
      cafe: 'cafes',
      cafes: 'cafes',
      coffee: 'cafes',
      photography: 'photography',
      photo: 'photography',
      festival: 'festivals',
      festivals: 'festivals',
      culture: 'local-culture',
      local: 'local-culture',
      food: 'local-culture',
      'hidden gems': 'hidden-gems',
      luxury: 'luxury',
      wellness: 'wellness',
      spa: 'wellness',
      cruise: 'cruises',
      'water sports': 'water-sports',
      'theme park': 'theme-parks',
    };

    const mapped = new Set<Interest>();
    for (const interest of interests) {
      const match = mapping[interest];
      if (match) mapped.add(match);
    }
    // Default if nothing matched
    if (mapped.size === 0) mapped.add('local-culture');
    return Array.from(mapped);
  };

  const canGenerate =
    formData.destination.trim() !== '' &&
    formData.startDate !== '' &&
    formData.endDate !== '';

  const handleGenerate = async () => {
    if (!canGenerate || isGenerating) return;
    setError(null);
    setIsGenerating(true);

    try {
      // Parse free-text fields
      const groupSize = parseGroupSize(formData.travelers);
      const { amount, currency } = parseBudget(formData.budget);
      const rawInterests = parseInterests(formData.interests);
      const mappedInterests = mapInterests(rawInterests);

      // Build full questionnaire data with sensible defaults
      const questionnaireData = {
        tripDetails: {
          startingLocation: '',
          destination: formData.destination,
          departureDate: formData.startDate,
          returnDate: formData.endDate,
          flexibleDates: false,
        },
        travelers: {
          tripType: (groupSize <= 1 ? 'solo' : groupSize === 2 ? 'couple' : 'friends') as TripType,
          groupSize,
          children: 0,
          seniors: 0,
          pets: false,
        },
        budget: {
          totalBudget: amount,
          currency,
          accommodation: 40,
          food: 25,
          activities: 20,
          shopping: 10,
          emergency: 5,
        },
        transport: {
          modes: ['mixed' as const],
        },
        accommodation: {
          types: ['hotel' as const],
          starRating: 3,
          amenities: [],
        },
        food: {
          dietaryPreferences: ['no-restrictions' as const],
        },
        interests: {
          interests: mappedInterests,
        },
        style: {
          travelStyle: 'mid-range' as const,
          travelPace: 'balanced' as const,
        },
      };

      // Inject into the questionnaire store so the itinerary page can
      // pick it up and call /api/generate (same flow as the full form)
      const store = useQuestionnaireStore.getState();
      store.updateTripDetails(questionnaireData.tripDetails);
      store.updateTravelers(questionnaireData.travelers);
      store.updateBudget(questionnaireData.budget);
      store.updateTransport(questionnaireData.transport);
      store.updateAccommodation(questionnaireData.accommodation);
      store.updateFood(questionnaireData.food);
      store.updateInterests(questionnaireData.interests);
      store.updateStyle(questionnaireData.style);

      // Generate an ID and navigate — the itinerary page handles the API call
      const tempId = createItineraryId();
      store.setGeneratedId(tempId);
      store.setGenerating(true);

      // Store the email so we can email after generation (optional)
      if (formData.email) {
        sessionStorage.setItem('atp:quick-plan-email', formData.email);
      }

      router.push(`/itinerary/${tempId}`);
    } catch (err) {
      console.error(err);
      setError("Couldn't start generation. Please try again.");
      setIsGenerating(false);
    }
  };

  return {
    formData,
    updateField,
    isGenerating,
    error,
    canGenerate,
    handleGenerate,
  };
}
