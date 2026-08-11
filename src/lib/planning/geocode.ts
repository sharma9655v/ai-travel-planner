import { fetchPlanningJson, isValidCoordinate } from './http';
import { CACHE_TTL, getOrCompute } from '@/lib/cache';
import type { GeoPoint } from './types';

const NOMINATIM_SEARCH_URL = process.env.NOMINATIM_SEARCH_URL ?? 'https://nominatim.openstreetmap.org/search';
const DEFAULT_USER_AGENT = 'AI-Travel-Planner/1.1 (+https://github.com/your-username/ai-travel-planner)';

interface NominatimResult {
  lat?: string;
  lon?: string;
  display_name?: string;
}

export async function geocodeLocation(query: string): Promise<GeoPoint | null> {
  const label = query.trim();
  if (!label) return null;

  // Destination coordinates are extremely stable — cache them for 30 days.
  return getOrCompute<GeoPoint>('geocode', [label], CACHE_TTL.destination, async () => {
    const url = new URL(NOMINATIM_SEARCH_URL);
    url.searchParams.set('q', label);
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('limit', '1');
    url.searchParams.set('addressdetails', '0');

    const results = await fetchPlanningJson<NominatimResult[]>(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': process.env.PLANNER_USER_AGENT ?? DEFAULT_USER_AGENT,
      },
    });
    const match = results[0];
    const latitude = Number(match?.lat);
    const longitude = Number(match?.lon);

    if (!isValidCoordinate(latitude, longitude)) return null;

    return {
      latitude,
      longitude,
      label: match?.display_name?.slice(0, 200) || label,
    };
  });
}
