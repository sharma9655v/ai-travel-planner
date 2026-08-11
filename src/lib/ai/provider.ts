import type { QuestionnaireData } from '@/types/questionnaire';
import type { TravelItinerary } from '@/types/itinerary';

import { callNvidiaBasicItinerary, parseAIResponse } from './nvidia';
import { validateItinerary, itinerarySchema } from '@/lib/validation/schemas';
import { validateBasicItinerary } from '@/lib/planning/basicSchema';
import { geocodeLocation } from '@/lib/planning/geocode';
import { findNearbyPlaces } from '@/lib/planning/osm';
import { findRoadRoute } from '@/lib/planning/routes';
import { fetchWeatherForecast, MAX_FORECAST_DAYS } from '@/lib/weather/service';
import { buildGenerationDigest } from '@/lib/planning/digest';
import { assembleItinerary } from '@/lib/planning/enrich';
import type {
  BasicItinerary,
  GeoPoint,
  PlaceCandidate,
} from '@/lib/planning/types';
import { createLogger, isDev } from '@/lib/logger';

// ============================================================
// Pipeline orchestrator — optimized for the FIRST USABLE ITINERARY:
//
//   questionnaire
//    ├─ geocode (destination + origin)        (parallel, cached)
//    ├─ [weather || places || arrival route]  (parallel, cached, non-fatal)
//    ├─ fast basic itinerary (compact AI call)
//    └─ deterministic assembly → validated TravelItinerary → show user
//
// Live hotel / restaurant / event / daily-route data is intentionally NOT
// fetched here: it moves to POST /api/enrich and runs in the background
// after the user sees the initial plan. Every external stage is optional:
// a failing provider degrades to an honest fallback instead of failing the
// whole request (except the AI itself, which is the core product).
// ============================================================

const log = createLogger('ai.provider');

/** Unwraps a settled promise into its value (null on rejection). */
async function settle<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch (error) {
    log.warn('phase.degraded', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

function isValidPoint(point: GeoPoint | null): point is GeoPoint {
  return (
    point !== null &&
    Number.isFinite(point.latitude) &&
    Number.isFinite(point.longitude) &&
    (Math.abs(point.latitude) > 0.0001 || Math.abs(point.longitude) > 0.0001)
  );
}

function isTimingEnabled(): boolean {
  // Phase timings are verbose — keep them out of production logs.
  return isDev() || process.env.GENERATION_TIMINGS === 'true';
}

/**
 * Fast path: the model sometimes answers with the full itinerary shape
 * directly (kept for compatibility). If it does, validate and return it.
 */
function tryLegacyFullItinerary(parsed: Record<string, unknown>): TravelItinerary | null {
  const result = itinerarySchema.safeParse(parsed);
  if (!result.success) return null;
  const { dailyItinerary } = result.data;
  return dailyItinerary && dailyItinerary.length > 0 ? result.data : null;
}

/** Loose picker for field names the model might vary. */
function pick(obj: Record<string, unknown>, ...keys: string[]): unknown {
  for (const key of keys) {
    if (obj[key] !== undefined) return obj[key];
  }
  return undefined;
}

/**
 * Deterministic normalization of HARMless structural differences, applied
 * BEFORE Zod validation. The model may wrap the plan in an extra object
 * ({"itinerary": {"dailyItinerary": [...]}}) or emit the day list as an
 * object with numeric keys — both map cleanly onto the expected shape.
 * Nothing is invented here: required data that is genuinely absent still
 * fails validation.
 */
function findDayList(parsed: Record<string, unknown>): unknown[] {
  const direct = pick(parsed, 'dailyItinerary', 'daily_itinerary', 'days');
  if (Array.isArray(direct)) return direct;

  const unwrapDayMap = (value: unknown): unknown[] => {
    if (Array.isArray(value)) return value;
    if (value && typeof value === 'object') {
      const map = value as Record<string, unknown>;
      const values = Object.values(map);
      if (values.length > 0 && values.every((v) => v && typeof v === 'object')) return values;
    }
    return [];
  };

  // Nested wrapper ({"itinerary": {"dailyItinerary": [...]}}).
  const wrapper = pick(parsed, 'itinerary', 'data', 'result');
  if (wrapper && typeof wrapper === 'object' && !Array.isArray(wrapper)) {
    const nested = pick(
      wrapper as Record<string, unknown>,
      'dailyItinerary',
      'daily_itinerary',
      'days'
    );
    const found = unwrapDayMap(nested);
    if (found.length > 0) return found;
  }

  // Day map as an object with numeric keys at the top level.
  return unwrapDayMap(direct);
}

/** True when every element looks like a day-plan object (bare day list). */
function isDayList(value: unknown): value is unknown[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((v) => v !== null && typeof v === 'object' && !Array.isArray(v))
  );
}

function toBasicItinerary(parsed: unknown): BasicItinerary {
  // Bare day list (the model occasionally returns just the days array).
  if (isDayList(parsed)) {
    return mapBasicDays(parsed, {});
  }

  const record = (parsed as Record<string, unknown>) ?? {};

  // If the days live inside a wrapper object, that object is the source of
  // the sibling metadata (highlights, cover description) as well.
  const wrapper = pick(record, 'itinerary', 'data', 'result');
  const wrapperRecord =
    wrapper && typeof wrapper === 'object' && !Array.isArray(wrapper)
      ? (wrapper as Record<string, unknown>)
      : null;

  const days = findDayList(record);
  return mapBasicDays(days, days.length > 0 ? record : (wrapperRecord ?? {}));
}

function mapBasicDays(rawDays: unknown[], source: Record<string, unknown>): BasicItinerary {
  const days = Array.isArray(rawDays) ? rawDays : [];

  return {
    highlights: Array.isArray(pick(source, 'highlights')) ? (pick(source, 'highlights') as string[]) : [],
    coverDescription: String(pick(source, 'coverDescription', 'cover_description') ?? ''),
    dailyItinerary: days.map((rawDay) => {
      const day = (rawDay as Record<string, unknown>) ?? {};
      const rawActivities = Array.isArray(day.activities) ? day.activities : [];
      return {
        day: Number(day.day) || 1,
        date: String(day.date ?? ''),
        title: String(day.title ?? ''),
        summary: String(day.summary ?? ''),
        activities: rawActivities.map((rawActivity) => {
          const activity = (rawActivity as Record<string, unknown>) ?? {};
          return {
            time: String(activity.time ?? '09:00'),
            endTime: String(activity.endTime ?? activity.time ?? '10:00'),
            name: String(activity.name ?? ''),
            description: String(activity.description ?? ''),
            location: String(activity.location ?? ''),
            latitude: Number(activity.latitude) || 0,
            longitude: Number(activity.longitude) || 0,
            duration: String(activity.duration ?? '1 hour'),
            category: String(activity.category ?? 'sightseeing') as BasicItinerary['dailyItinerary'][number]['activities'][number]['category'],
            estimatedCost: Number(activity.estimatedCost) || 0,
            tips: String(activity.tips ?? ''),
          };
        }),
        totalCost: Number(day.totalCost) || 0,
      };
    }),
    localCustoms: Array.isArray(pick(source, 'localCustoms', 'local_customs')) ? (pick(source, 'localCustoms', 'local_customs') as string[]) : [],
    travelTips: Array.isArray(pick(source, 'travelTips', 'travel_tips')) ? (pick(source, 'travelTips', 'travel_tips') as string[]) : [],
    importantNotes: Array.isArray(pick(source, 'importantNotes', 'important_notes')) ? (pick(source, 'importantNotes', 'important_notes') as string[]) : [],
  };
}

export async function generateItinerary(
  data: QuestionnaireData
): Promise<TravelItinerary> {
  const startedAt = Date.now();
  const phases: Record<string, number> = {};

  // Fast fail when the AI backend is not configured — the pipeline must not
  // spend time (or provider quotas) on context fetching for a doomed request.
  if (!process.env.NVIDIA_API_KEY) {
    try {
      await callNvidiaBasicItinerary(data, '');
    } catch (error) {
      throw error;
    }
  }

  log.info('ai.generate.start');

  const destinationName = data.tripDetails.destination.trim();
  const originName = data.tripDetails.startingLocation?.trim() ?? '';

  // Stage 0 — resolve coordinates (cached; non-fatal: AI can still invent the layout).
  const geocodeStart = Date.now();
  const [destination, origin] = await Promise.all([
    settle(destinationName ? geocodeLocation(destinationName) : Promise.resolve(null)),
    settle(originName ? geocodeLocation(originName) : Promise.resolve(null)),
  ]);
  phases.geocodeMs = Date.now() - geocodeStart;

  // Stage 1 — parallel, cached, non-fatal context gathering.
  const contextStart = Date.now();
  const weatherStart = Date.now();
  const weatherPromise = settle(
    isValidPoint(destination)
      ? fetchWeatherForecast(destination.latitude, destination.longitude, MAX_FORECAST_DAYS)
      : Promise.resolve(null)
  ).then((value) => {
    phases.weatherMs = Date.now() - weatherStart;
    return value;
  });
  const placesStart = Date.now();
  const placesPromise = settle<PlaceCandidate[]>(
    isValidPoint(destination) ? findNearbyPlaces(destination) : Promise.resolve([])
  ).then((candidates) => {
    phases.placesMs = Date.now() - placesStart;
    return candidates ?? [];
  });
  const routesStart = Date.now();
  const routesPromise = settle(
    isValidPoint(destination) && isValidPoint(origin)
      ? findRoadRoute(origin, destination, 'arrival')
      : Promise.resolve(null)
  ).then((value) => {
    phases.routesMs = Date.now() - routesStart;
    return value;
  });
  const [weather, places, arrivalRoute] = await Promise.all([
    weatherPromise,
    placesPromise,
    routesPromise,
  ]);
  phases.contextMs = Date.now() - contextStart;

  log.info('ai.generate.context_ready', {
    hasDestination: isValidPoint(destination),
    weatherDays: weather?.forecast?.length ?? 0,
    places: places?.length ?? 0,
    hasArrivalRoute: Boolean(arrivalRoute),
  });

  // Stage 2 — fast basic itinerary (compact AI call).
  // Retried only when the OUTPUT was unusable (parse/validation) — provider
  // errors (timeouts, 5xx) fail fast instead of doubling AI latency.
  const MAX_ATTEMPTS = 2;
  let lastError: unknown;
  let itinerary: TravelItinerary | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS && itinerary === null; attempt++) {
    try {
      const digest = buildGenerationDigest({
        destination,
        weather,
        places,
        arrivalRoute,
      });

      const aiStart = Date.now();
      const rawResponse = await callNvidiaBasicItinerary(data, digest);
      phases.aiMs = Date.now() - aiStart;

      const parseStart = Date.now();
      const parsed = parseAIResponse(rawResponse) as Record<string, unknown>;
      phases.parseMs = Date.now() - parseStart;

      // Compatibility fast path: the model answered with the full shape.
      const legacy = tryLegacyFullItinerary(parsed);
      if (legacy) {
        itinerary = legacy;
        break;
      }

      const basicParsed = toBasicItinerary(parsed);
      const validateStart = Date.now();
      const basic = validateBasicItinerary(basicParsed);
      phases.validateMs = Date.now() - validateStart;

      // Stage 3 — deterministic assembly. Hotels / restaurants / events /
      // daily routes are deliberately LEFT OUT of the critical path: they are
      // fetched by POST /api/enrich in the background after the user sees
      // this plan. The assembly contract already degrades gracefully when
      // these arrays are empty.
      const assembleStart = Date.now();
      itinerary = assembleItinerary(
        {
          data,
          destination,
          weather,
          places,
          hotels: [],
          restaurants: [],
          events: [],
          arrivalRoute,
          dailyRoutes: [],
        },
        basic
      );
      itinerary = validateItinerary(itinerary);
      phases.assembleMs = Date.now() - assembleStart;

      log.info('ai.generate.end', {
        durationMs: Date.now() - startedAt,
        attempt,
        days: itinerary.dailyItinerary.length,
        enrichedHotels: 0,
        enrichedRestaurants: 0,
        events: 0,
        routes: 0,
      });
    } catch (error) {
      lastError = error;
      const errorName = error instanceof Error ? error.name : 'UnknownError';
      log.warn('ai.generate.attempt_failed', {
        attempt,
        maxAttempts: MAX_ATTEMPTS,
        durationMs: Date.now() - startedAt,
        errorName,
        message: error instanceof Error ? error.message : 'Unknown error',
      });

      if (errorName === 'MissingApiKeyError') break;
      // Provider-level errors fail fast: retrying a 5xx/timeout usually
      // doubles the user's wait for no gain.
      if (errorName === 'NvidiaApiError') break;
    }
  }

  if (itinerary) {
    if (isTimingEnabled()) {
      log.info('ai.generate.phases', {
        durationMs: Date.now() - startedAt,
        ...phases,
        aiSharePercent: phases.aiMs ? Math.round((phases.aiMs / (Date.now() - startedAt)) * 100) : 0,
      });
    }
    return itinerary;
  }

  log.error('ai.generate.error', {
    durationMs: Date.now() - startedAt,
    errorName: lastError instanceof Error ? lastError.name : 'UnknownError',
    message: lastError instanceof Error ? lastError.message : 'Unknown error',
  });
  throw lastError;
}