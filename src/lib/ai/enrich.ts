import type { QuestionnaireData } from '@/types/questionnaire';
import type { TravelItinerary } from '@/types/itinerary';
import { validateItinerary } from '@/lib/validation/schemas';
import { geocodeLocation } from '@/lib/planning/geocode';
import { findNearbyPlaces, findHotels, findRestaurants } from '@/lib/planning/osm';
import { findEvents } from '@/lib/planning/events';
import { findDailyRoutes } from '@/lib/planning/routes';
import { assembleItinerary } from '@/lib/planning/enrich';
import { getWeatherAnchorCoords } from '@/lib/weather/anchor';
import type {
  EnrichmentWeather,
  EventCandidate,
  GeoPoint,
  HotelCandidate,
  PlaceCandidate,
  RestaurantCandidate,
} from '@/lib/planning/types';
import type { RoutePlan } from '@/types/itinerary';
import { createLogger, isDev } from '@/lib/logger';

// ============================================================
// Background enrichment service — powers POST /api/enrich.
//
// Takes an already-generated itinerary (the fast initial plan) and upgrades
// it with live data that was intentionally excluded from the critical path:
//   - hotels (OSM, cached)
//   - restaurants (OSM, cached)
//   - dated events (Ticketmaster, optional)
//   - daily road routes between a day's stops (OSRM, cached)
//   - place snapping + hidden gems (OSM places, cached)
//
// Enrichment is purely additive and idempotent: if any provider fails, the
// section degrades to the same honest fallback the initial plan used, and
// the caller keeps the fully usable original itinerary.
// ============================================================

const log = createLogger('ai.enrich');

/** Unwraps a settled promise into its value (null on rejection). */
async function settle<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch (error) {
    log.warn('enrich.phase.degraded', {
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

/**
 * Reconstructs the deterministic assembly input (BasicItinerary) from an
 * already-validated itinerary. This lets enrichment re-run assembly without
 * a second AI call — the basic plan is derived 1:1 from the initial plan.
 */
function basicFromItinerary(itinerary: TravelItinerary) {
  return {
    highlights: itinerary.tripSummary.highlights ?? [],
    coverDescription: itinerary.tripSummary.coverDescription ?? '',
    dailyItinerary: itinerary.dailyItinerary.map((day) => ({
      day: day.day,
      date: day.date,
      title: day.title,
      summary: day.summary,
      totalCost: day.totalCost,
      activities: day.activities.map((activity) => ({
        time: activity.time,
        endTime: activity.endTime,
        name: activity.name,
        description: activity.description,
        location: activity.location,
        latitude: activity.latitude,
        longitude: activity.longitude,
        duration: activity.duration,
        category: activity.category,
        estimatedCost: activity.estimatedCost,
        tips: activity.tips ?? '',
      })),
    })),
    localCustoms: itinerary.localCustoms ?? [],
    travelTips: itinerary.travelTips ?? [],
    importantNotes: itinerary.importantNotes ?? [],
  };
}

export async function enrichItinerary(
  data: QuestionnaireData,
  itinerary: TravelItinerary
): Promise<TravelItinerary> {
  const startedAt = Date.now();
  const phases: Record<string, number> = {};

  log.info('ai.enrich.start', {
    destination: itinerary.tripSummary.destination,
    days: itinerary.dailyItinerary.length,
  });

  // Destination point: prefer the (cached) geocode of the destination name;
  // fall back to the first real coordinates in the plan.
  const geocodeStart = Date.now();
  const destinationName = itinerary.tripSummary.destination.trim();
  const geocoded = destinationName
    ? await settle(geocodeLocation(destinationName))
    : null;
  phases.geocodeMs = Date.now() - geocodeStart;

  const anchor = getWeatherAnchorCoords(itinerary);
  const destination: GeoPoint | null =
    geocoded ??
    (anchor
      ? { latitude: anchor.latitude, longitude: anchor.longitude, label: itinerary.tripSummary.destination }
      : null);

  const arrivalRoute =
    itinerary.routePlans?.find((route) => route.kind === 'arrival') ?? null;
  const weather: EnrichmentWeather | null = itinerary.weatherForecast
    ? { forecast: itinerary.weatherForecast, alerts: [] }
    : null;

  // All enrichment providers run concurrently; every one of them is optional.
  const fetchStart = Date.now();
  const basic = basicFromItinerary(itinerary);
  const stopsByDay = basic.dailyItinerary
    .map((day) => ({
      day: day.day,
      stops: day.activities
        .filter(
          (activity) =>
            Number.isFinite(activity.latitude) &&
            Number.isFinite(activity.longitude) &&
            (Math.abs(activity.latitude) > 0.0001 || Math.abs(activity.longitude) > 0.0001)
        )
        .map((activity) => ({
          latitude: activity.latitude,
          longitude: activity.longitude,
          label: activity.name,
        } as GeoPoint)),
    }))
    .filter((entry) => entry.stops.length >= 2);

  const [places, hotels, restaurants, events, dailyRoutes] = await Promise.all([
    settle<PlaceCandidate[]>(
      isValidPoint(destination) ? findNearbyPlaces(destination) : Promise.resolve([])
    ).then((candidates) => candidates ?? []),
    settle<HotelCandidate[]>(
      isValidPoint(destination) ? findHotels(destination) : Promise.resolve([])
    ).then((candidates) => candidates ?? []),
    settle<RestaurantCandidate[]>(
      isValidPoint(destination) ? findRestaurants(destination) : Promise.resolve([])
    ).then((candidates) => candidates ?? []),
    settle<EventCandidate[]>(
      isValidPoint(destination)
        ? findEvents(destination, data.tripDetails.departureDate, data.tripDetails.returnDate)
        : Promise.resolve([])
    ).then((candidates) => candidates ?? []),
    settle<RoutePlan[]>(findDailyRoutes(stopsByDay)).then((routes) => routes ?? []),
  ]);
  phases.fetchMs = Date.now() - fetchStart;

  const assembleStart = Date.now();
  const enriched = assembleItinerary(
    {
      data,
      destination,
      weather,
      places,
      hotels,
      restaurants,
      events,
      arrivalRoute,
      dailyRoutes,
    },
    basic
  );
  const validated = validateItinerary(enriched);
  phases.assembleMs = Date.now() - assembleStart;

  log.info('ai.enrich.end', {
    durationMs: Date.now() - startedAt,
    hotels: hotels?.length ?? 0,
    restaurants: restaurants?.length ?? 0,
    events: events?.length ?? 0,
    routes: dailyRoutes?.length ?? 0,
  });

  if (isDev() || process.env.GENERATION_TIMINGS === 'true') {
    log.info('ai.enrich.phases', { durationMs: Date.now() - startedAt, ...phases });
  }

  return validated;
}