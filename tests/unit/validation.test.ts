import { describe, expect, it } from 'vitest';
import {
  ItineraryValidationError,
  itinerarySchema,
  questionnaireSchema,
  validateItinerary,
  validateQuestionnaire,
} from '@/lib/validation/schemas';
import { createDefaultQuestionnaireData } from '@/types/questionnaire';
import { tokyoItinerary } from '../fixtures';

describe('itinerarySchema / validateItinerary', () => {
  it('accepts a well-formed AI itinerary', () => {
    const result = itinerarySchema.safeParse(tokyoItinerary);
    expect(result.success).toBe(true);
  });

  it('returns the parsed data unchanged in shape', () => {
    const validated = validateItinerary(tokyoItinerary);
    expect(validated.tripSummary.destination).toBe('Tokyo');
    expect(validated.dailyItinerary).toHaveLength(2);
  });

  it('coerces string numbers from the model', () => {
    const withStrings = JSON.parse(
      JSON.stringify(tokyoItinerary, (_key, value) => {
        if (typeof value === 'number') return String(value);
        return value;
      })
    );
    const validated = validateItinerary(withStrings);
    expect(validated.dailyItinerary[0].day).toBe(1);
    expect(validated.budgetBreakdown.totalEstimated).toBe(250000);
  });

  it('falls back to a valid category for unknown activity categories', () => {
    const bad = structuredClone(tokyoItinerary);
    bad.dailyItinerary[0].activities[0].category = 'sights' as never;
    const validated = validateItinerary(bad);
    expect(validated.dailyItinerary[0].activities[0].category).toBe('sightseeing');
  });

  it('rejects a missing required section', () => {
    const broken = structuredClone(tokyoItinerary) as unknown as Record<string, unknown>;
    delete broken.restaurants;
    expect(() => validateItinerary(broken)).toThrow(ItineraryValidationError);
  });

  it('rejects non-finite numbers', () => {
    const broken = structuredClone(tokyoItinerary);
    broken.dailyItinerary[0].activities[0].latitude = Number.NaN;
    expect(() => validateItinerary(broken)).toThrow(ItineraryValidationError);
  });

  it('rejects non-object input', () => {
    expect(() => validateItinerary('oops')).toThrow(ItineraryValidationError);
    expect(() => validateItinerary(null)).toThrow(ItineraryValidationError);
  });
});

describe('questionnaireSchema / validateQuestionnaire', () => {
  // The API contract requires destination + departure date (the old route
  // returned 400 for the same) — the raw defaults are intentionally invalid.
  const validData = () => {
    const data = createDefaultQuestionnaireData();
    data.tripDetails.destination = 'Tokyo';
    data.tripDetails.departureDate = '2026-10-01';
    return data;
  };

  it('accepts a complete questionnaire', () => {
    const result = questionnaireSchema.safeParse(validData());
    expect(result.success).toBe(true);
  });

  it('accepts a valid edited questionnaire', () => {
    const data = validData();
    data.tripDetails.destination = 'Kyoto';
    data.travelers.groupSize = 4;
    expect(questionnaireSchema.safeParse(data).success).toBe(true);
  });

  it('rejects a missing destination', () => {
    const data = validData();
    data.tripDetails.destination = '';
    const result = questionnaireSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejects a nonsensical group size', () => {
    const data = createDefaultQuestionnaireData();
    data.travelers.groupSize = 0;
    expect(questionnaireSchema.safeParse(data).success).toBe(false);
  });

  it('rejects garbage payloads', () => {
    expect(() => validateQuestionnaire({ tripDetails: {} })).toThrow(ItineraryValidationError);
    expect(() => validateQuestionnaire(null)).toThrow(ItineraryValidationError);
    expect(() => validateQuestionnaire(42)).toThrow(ItineraryValidationError);
  });
});
