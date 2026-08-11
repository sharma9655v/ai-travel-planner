import { z } from 'zod';
import { createLogger, isDev } from '@/lib/logger';
import { ItineraryValidationError } from '@/lib/validation/schemas';

const log = createLogger('validation.basic');

// ============================================================
// Basic itinerary contract — the compact object returned by the
// fast first-generation AI call. It deliberately avoids hotels,
// restaurants, events, routes and budget numbers: those are filled
// in deterministically by the enrichment stage from live providers.
// ============================================================

const BASIC_ACTIVITY_CATEGORIES = [
  'sightseeing',
  'food',
  'transport',
  'accommodation',
  'adventure',
  'shopping',
  'relaxation',
  'culture',
  'nightlife',
  'wellness',
] as const;

const num = () =>
  z.coerce.number().transform((v) => (Number.isFinite(v) ? v : 0));

export const basicActivitySchema = z.object({
  time: z.string(),
  endTime: z.string(),
  name: z.string(),
  description: z.string(),
  location: z.string(),
  latitude: num().default(0),
  longitude: num().default(0),
  duration: z.string(),
  category: z.enum(BASIC_ACTIVITY_CATEGORIES).catch('sightseeing'),
  estimatedCost: num().default(0),
  tips: z.string().optional(),
});

export const basicDaySchema = z.object({
  day: z.coerce.number().int().finite(),
  date: z.string(),
  title: z.string(),
  summary: z.string(),
  activities: z.array(basicActivitySchema),
  totalCost: num().default(0),
});

export const basicItinerarySchema = z.object({
  highlights: z.array(z.string()).default([]),
  coverDescription: z.string().default(''),
  dailyItinerary: z.array(basicDaySchema).min(1),
  localCustoms: z.array(z.string()).default([]),
  travelTips: z.array(z.string()).default([]),
  importantNotes: z.array(z.string()).default([]),
});

export type ValidatedBasicItinerary = z.infer<typeof basicItinerarySchema>;

export function validateBasicItinerary(raw: unknown): ValidatedBasicItinerary {
  const result = basicItinerarySchema.safeParse(raw);
  if (!result.success) {
    // Detailed shape of the failure (path / expected / received) is
    // development-only — the raw response can echo user trip data.
    if (isDev()) {
      log.error('ai.basic_validation_error', {
        issueCount: result.error.issues.length,
        issues: result.error.issues.slice(0, 10).map((issue) => ({
          path: issue.path.join('.'),
          code: issue.code,
          expected: 'expected' in issue ? issue.expected : undefined,
          received: 'received' in issue ? issue.received : undefined,
          message: issue.message,
        })),
      });
    }
    throw new ItineraryValidationError(
      'The AI returned a malformed itinerary. Please try again.'
    );
  }
  return result.data;
}

export { BASIC_ACTIVITY_CATEGORIES };