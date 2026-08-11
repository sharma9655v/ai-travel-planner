import { z } from 'zod';
import { createLogger, isDev } from '@/lib/logger';

const log = createLogger('validation');

// ============================================================
// Runtime validation — the shared contract between the AI output
// and the UI. The AI layer (provider.ts, refine.ts) validates its
// output here so a malformed model response becomes a clean API
// error instead of a client-side crash. Request bodies use the
// same schemas at the route boundary.
// ============================================================

const ACTIVITY_CATEGORIES = [
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

// Model numbers sometimes arrive as strings ("3000") — coerce. Non-finite
// values (NaN/Infinity from bad AI output like "" or "N/A") default to 0
// so a single bad cost field doesn't reject the whole itinerary.
const num = () =>
  z.coerce.number().transform((v) => (Number.isFinite(v) ? v : 0));

export const activitySchema = z.object({
  time: z.string(),
  endTime: z.string(),
  name: z.string(),
  description: z.string(),
  location: z.string(),
  latitude: num(),
  longitude: num(),
  duration: z.string(),
  // Cosmetic field — an unknown category would only affect styling, so fall
  // back to a safe default rather than rejecting the whole itinerary.
  category: z.enum(ACTIVITY_CATEGORIES).catch('sightseeing'),
  estimatedCost: num(),
  tips: z.string(),
  rating: num().optional(),
  openingHours: z.string().optional(),
  distance: z.string().optional(),
  bestTimeToVisit: z.string().optional(),
});

export const dayPlanSchema = z.object({
  day: z.coerce.number().int().finite(),
  date: z.string(),
  title: z.string(),
  summary: z.string(),
  activities: z.array(activitySchema),
  totalCost: num(),
});

export const weatherDaySchema = z.object({
  date: z.string(),
  tempHigh: num(),
  tempLow: num(),
  condition: z.string(),
  icon: z.string(),
  humidity: num(),
  windSpeed: num(),
  recommendation: z.string(),
  precipitationProbability: num().optional(),
});

export const accommodationSchema = z.object({
  name: z.string(),
  type: z.string(),
  rating: num(),
  pricePerNight: num(),
  location: z.string(),
  latitude: num(),
  longitude: num(),
  amenities: z.array(z.string()),
  description: z.string(),
});

export const restaurantSchema = z.object({
  name: z.string(),
  cuisine: z.string(),
  priceRange: z.string(),
  rating: num(),
  dietaryOptions: z.array(z.string()),
  location: z.string(),
  latitude: num(),
  longitude: num(),
  description: z.string(),
  mustTry: z.array(z.string()),
});

export const budgetCategorySchema = z.object({
  category: z.string(),
  estimated: num(),
  percentage: num(),
});

export const packingItemSchema = z.object({
  item: z.string(),
  packed: z.boolean(),
  essential: z.boolean(),
});

export const packingCategorySchema = z.object({
  category: z.string(),
  items: z.array(packingItemSchema),
});

export const transportDetailSchema = z.object({
  from: z.string(),
  to: z.string(),
  mode: z.string(),
  duration: z.string(),
  estimatedCost: num(),
  notes: z.string(),
});

export const emergencyContactSchema = z.object({
  service: z.string(),
  number: z.string(),
  notes: z.string(),
});

export const hiddenGemSchema = z.object({
  name: z.string(),
  description: z.string(),
  location: z.string(),
  latitude: num(),
  longitude: num(),
  category: z.string(),
  tip: z.string(),
});

export const routePointSchema = z.object({
  latitude: num(),
  longitude: num(),
});

export const routePlanSchema = z.object({
  kind: z.enum(['arrival', 'daily']),
  day: z.coerce.number().int().positive().optional(),
  distanceKm: num(),
  durationMinutes: num(),
  geometry: z.array(routePointSchema),
});

export const itinerarySchema = z.object({
  tripSummary: z.object({
    destination: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    totalDays: num(),
    totalBudgetEstimate: num(),
    currency: z.string(),
    travelStyle: z.string(),
    highlights: z.array(z.string()),
    coverDescription: z.string(),
    bestTimeToVisit: z.string().optional(),
  }),
  dailyItinerary: z.array(dayPlanSchema),
  weatherForecast: z.array(weatherDaySchema).optional(),
  routePlans: z.array(routePlanSchema).optional(),
  accommodations: z.array(accommodationSchema),
  restaurants: z.array(restaurantSchema),
  budgetBreakdown: z.object({
    totalEstimated: num(),
    totalBudget: num(),
    currency: z.string(),
    categories: z.array(budgetCategorySchema),
    savingsTips: z.array(z.string()),
  }),
  packingChecklist: z.array(packingCategorySchema),
  transportationDetails: z.array(transportDetailSchema),
  emergencyContacts: z.array(emergencyContactSchema),
  hiddenGems: z.array(hiddenGemSchema),
  localCustoms: z.array(z.string()),
  travelTips: z.array(z.string()),
  importantNotes: z.array(z.string()),
});

export type ValidatedItinerary = z.infer<typeof itinerarySchema>;

/** Thrown when AI output (or a request payload) fails schema validation. */
export class ItineraryValidationError extends Error {
  constructor(message = 'The itinerary data is malformed.') {
    super(message);
    this.name = 'ItineraryValidationError';
  }
}

/** Validates and normalizes AI-generated output. Throws ItineraryValidationError. */
export function validateItinerary(raw: unknown): ValidatedItinerary {
  const result = itinerarySchema.safeParse(raw);
  if (!result.success) {
    // Detailed shape of the failure (path / expected / received) is
    // development-only — the raw response can echo user trip data.
    if (isDev()) {
      log.error('ai.validation_error', {
        target: 'itinerary',
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

// ------------------------------------------------------------
// Questionnaire (request payload for /api/generate)
// ------------------------------------------------------------

export const questionnaireSchema = z.object({
  tripDetails: z.object({
    startingLocation: z.string().max(200),
    destination: z.string().min(1).max(200),
    departureDate: z.string().min(1).max(50),
    returnDate: z.string().max(50),
    flexibleDates: z.boolean(),
  }),
  travelers: z.object({
    tripType: z.enum(['solo', 'couple', 'family', 'friends', 'business', 'honeymoon']),
    groupSize: z.number().int().min(1).max(100),
    children: z.number().int().min(0).max(100),
    seniors: z.number().int().min(0).max(100),
    pets: z.boolean(),
  }),
  budget: z.object({
    totalBudget: z.number().min(0).max(1_000_000_000),
    currency: z.string().min(1).max(10),
    accommodation: z.number().min(0).max(100),
    food: z.number().min(0).max(100),
    activities: z.number().min(0).max(100),
    shopping: z.number().min(0).max(100),
    emergency: z.number().min(0).max(100),
  }),
  transport: z.object({
    modes: z.array(
      z.enum([
        'flight',
        'train',
        'bus',
        'metro',
        'taxi',
        'rental-car',
        'self-drive',
        'bike',
        'walking',
        'electric-vehicle',
        'mixed',
      ])
    ),
  }),
  accommodation: z.object({
    types: z.array(z.enum(['hotel', 'hostel', 'airbnb', 'resort', 'homestay', 'camping'])),
    starRating: z.number().min(0).max(5),
    amenities: z.array(
      z.enum(['wifi', 'parking', 'pool', 'gym', 'pet-friendly', 'wheelchair-accessible'])
    ),
  }),
  food: z.object({
    dietaryPreferences: z.array(
      z.enum([
        'vegetarian',
        'vegan',
        'jain',
        'halal',
        'kosher',
        'gluten-free',
        'dairy-free',
        'seafood',
        'no-restrictions',
      ])
    ),
  }),
  interests: z.object({
    interests: z.array(
      z.enum([
        'adventure',
        'mountains',
        'beaches',
        'hiking',
        'wildlife',
        'museums',
        'historical',
        'shopping',
        'nightlife',
        'cafes',
        'photography',
        'festivals',
        'local-culture',
        'hidden-gems',
        'luxury',
        'wellness',
        'cruises',
        'water-sports',
        'theme-parks',
      ])
    ),
  }),
  style: z.object({
    travelStyle: z.enum(['budget', 'mid-range', 'luxury']),
    travelPace: z.enum(['relaxed', 'balanced', 'fast']),
  }),
});

export type ValidatedQuestionnaire = z.infer<typeof questionnaireSchema>;

/** Validates a /api/generate request payload. Throws ItineraryValidationError. */
export function validateQuestionnaire(raw: unknown): ValidatedQuestionnaire {
  const result = questionnaireSchema.safeParse(raw);
  if (!result.success) {
    const first = result.error.issues[0];
    log.warn('request_validation_error', {
      target: 'questionnaire',
      issueCount: result.error.issues.length,
      firstIssue: first ? { path: first.path.join('.'), message: first.message } : undefined,
      issues: result.error.issues.slice(0, 10).map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      })),
    });
    throw new ItineraryValidationError(
      first ? first.message : 'The request payload is malformed.'
    );
  }
  return result.data;
}
