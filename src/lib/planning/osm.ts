import type { ActivityCategory } from '@/types/itinerary';
import { fetchPlanningJson, isValidCoordinate, PlanningProviderError } from './http';
import { CACHE_TTL, coordKey, getOrCompute } from '@/lib/cache';
import { createLogger } from '@/lib/logger';
import type { GeoPoint, HotelCandidate, PlaceCandidate, RestaurantCandidate } from './types';

const log = createLogger('planning.osm');

// Read at request time so tests can stub the URL per test.
function overpassUrl(): string {
  return process.env.OVERPASS_API_URL?.trim() || 'https://overpass-api.de/api/interpreter';
}

/** Optional second Overpass instance, tried only when the primary fails. */
function overpassFallbackUrl(): string {
  return process.env.OVERPASS_FALLBACK_URL?.trim() || '';
}

// Public Overpass instances (and OSM policy) expect identifying clients;
// a missing User-Agent is a common cause of HTTP 406 rejections.
const OVERPASS_HEADERS: Record<string, string> = {
  'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
  'User-Agent': 'ai-travel-planner (NVIDIA NIM travel planner; planning context fetch)',
};
const SEARCH_RADIUS_METERS = 8_000;

// Public Overpass instances queue heavily-throttled clients; measured full
// query latency reached ~13s on overpass-api.de. The 20s window keeps the
// context stage bounded while giving a queued query time to complete.
const OVERPASS_TIMEOUT_MS = 20_000;

/**
 * TTL for cached Overpass POI results (places / hotels / restaurants).
 * Defaults to CACHE_TTL.places (7 days) — POI data changes slowly. Overridable
 * via POI_CACHE_TTL_SECONDS for ops.
 */
function poiTtlSeconds(): number {
  const raw = Number(process.env.POI_CACHE_TTL_SECONDS);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : CACHE_TTL.places;
}

interface OverpassElement {
  type?: string;
  id?: number;
  lat?: number;
  lon?: number;
  center?: { lat?: number; lon?: number };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements?: OverpassElement[];
}

function pointFor(element: OverpassElement): { latitude: number; longitude: number } | null {
  const latitude = element.lat ?? element.center?.lat;
  const longitude = element.lon ?? element.center?.lon;
  return typeof latitude === 'number' && typeof longitude === 'number' && isValidCoordinate(latitude, longitude)
    ? { latitude, longitude }
    : null;
}

function displayName(tags: Record<string, string>): string | null {
  const name = tags.name || tags['name:en'];
  return name?.trim().slice(0, 160) || null;
}

function locationFor(tags: Record<string, string>, fallback: string): string {
  return tags['addr:street']?.trim().slice(0, 160) || tags['addr:suburb']?.trim().slice(0, 160) || fallback;
}

function categoryFor(tags: Record<string, string>): ActivityCategory {
  const amenity = tags.amenity;
  const tourism = tags.tourism;
  const leisure = tags.leisure;

  if (amenity === 'restaurant' || amenity === 'cafe' || amenity === 'fast_food') return 'food';
  if (amenity === 'nightclub' || amenity === 'bar') return 'nightlife';
  if (amenity === 'museum' || amenity === 'theatre' || amenity === 'arts_centre' || tags.historic) return 'culture';
  if (leisure === 'park' || leisure === 'nature_reserve' || leisure === 'garden') return 'relaxation';
  if (tourism === 'theme_park' || tourism === 'zoo') return 'adventure';
  if (tags.shop) return 'shopping';
  return 'sightseeing';
}

function sourceId(element: OverpassElement): string | null {
  return element.type && typeof element.id === 'number' ? `osm:${element.type}:${element.id}` : null;
}

async function queryOverpass(query: string): Promise<OverpassElement[]> {
  const init: RequestInit = {
    method: 'POST',
    headers: OVERPASS_HEADERS,
    body: `data=${encodeURIComponent(query)}`,
  };

  try {
    const response = await fetchPlanningJson<OverpassResponse>(overpassUrl(), init, OVERPASS_TIMEOUT_MS);
    return Array.isArray(response.elements) ? response.elements : [];
  } catch (error) {
    // Degrade to the fallback instance only for provider-level failures
    // (timeout / rejection) — not for a malformed upstream response.
    const fallback = overpassFallbackUrl();
    if (fallback && error instanceof PlanningProviderError) {
      log.warn('overpass.fallback', {
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      const response = await fetchPlanningJson<OverpassResponse>(fallback, init, OVERPASS_TIMEOUT_MS);
      return Array.isArray(response.elements) ? response.elements : [];
    }
    throw error;
  }
}

function candidatesFrom(
  elements: OverpassElement[],
  fallback: GeoPoint,
  maxResults: number
): PlaceCandidate[] {
  const seen = new Set<string>();
  const candidates: PlaceCandidate[] = [];

  for (const element of elements) {
    const tags = element.tags ?? {};
    const coordinates = pointFor(element);
    const id = sourceId(element);
    const name = displayName(tags);
    if (!coordinates || !id || !name || seen.has(id)) continue;
    seen.add(id);
    candidates.push({
      sourceId: id,
      name,
      label: name,
      location: locationFor(tags, fallback.label),
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      category: categoryFor(tags),
      kind: tags.tourism || tags.amenity || tags.historic || tags.leisure || tags.shop || 'place',
    });
    if (candidates.length === maxResults) break;
  }

  return candidates;
}

function around(point: GeoPoint): string {
  return `${SEARCH_RADIUS_METERS},${point.latitude.toFixed(5)},${point.longitude.toFixed(5)}`;
}

export async function findNearbyPlaces(point: GeoPoint): Promise<PlaceCandidate[]> {
  // Cached per destination so repeated trips never re-hit the (rate-limited)
  // Overpass public API. Place lists change slowly.
  return (await getOrCompute<PlaceCandidate[]>(
    'places',
    [coordKey(point.latitude, point.longitude)],
    poiTtlSeconds(),
    async () => {
      const elements = await queryOverpass(`
[out:json][timeout:12];
(
  nwr["tourism"~"attraction|museum|gallery|viewpoint|zoo|theme_park"](around:${around(point)});
  nwr["historic"](around:${around(point)});
  nwr["amenity"~"museum|arts_centre|theatre|cinema|marketplace"](around:${around(point)});
  nwr["leisure"~"park|garden|nature_reserve"](around:${around(point)});
);
out center tags 24;`);
      return candidatesFrom(elements, point, 24);
    }
  )) ?? [];
}

export async function findHotels(point: GeoPoint): Promise<HotelCandidate[]> {
  return (await getOrCompute<HotelCandidate[]>(
    'hotels',
    [coordKey(point.latitude, point.longitude)],
    CACHE_TTL.hotels,
    async () => {
      const elements = await queryOverpass(`
[out:json][timeout:12];
(
  nwr["tourism"~"hotel|hostel|guest_house|apartment|resort"](around:${around(point)});
);
out center tags 12;`);

      return candidatesFrom(elements, point, 12).map((candidate) => {
        const element = elements.find((item) => sourceId(item) === candidate.sourceId);
        const tags = element?.tags ?? {};
        const amenities = [
          tags.internet_access && tags.internet_access !== 'no' ? 'WiFi' : null,
          tags.parking && tags.parking !== 'no' ? 'Parking' : null,
          tags['wheelchair'] && tags['wheelchair'] !== 'no' ? 'Accessible' : null,
        ].filter((item): item is string => Boolean(item));
        const starRating = Number(tags.stars);

        return {
          ...candidate,
          amenities,
          starRating: Number.isFinite(starRating) ? starRating : 0,
        };
      });
    }
  )) ?? [];
}

export async function findRestaurants(point: GeoPoint): Promise<RestaurantCandidate[]> {
  return (await getOrCompute<RestaurantCandidate[]>(
    'restaurants',
    [coordKey(point.latitude, point.longitude)],
    CACHE_TTL.restaurants,
    async () => {
      const elements = await queryOverpass(`
[out:json][timeout:12];
(
  nwr["amenity"~"restaurant|cafe|fast_food"](around:${around(point)});
);
out center tags 16;`);

      return candidatesFrom(elements, point, 16).map((candidate) => {
        const element = elements.find((item) => sourceId(item) === candidate.sourceId);
        const tags = element?.tags ?? {};
        const dietaryOptions = Object.entries(tags)
          .filter(([key, value]) => key.startsWith('diet:') && value === 'yes')
          .map(([key]) => key.replace('diet:', ''))
          .slice(0, 4);

        return {
          ...candidate,
          cuisine: tags.cuisine?.replace(/;/g, ', ') || 'Not listed',
          priceRange: tags['price_range'] || 'Not listed',
          dietaryOptions,
        };
      });
    }
  )) ?? [];
}