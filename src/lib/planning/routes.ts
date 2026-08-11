import type { RoutePlan } from '@/types/itinerary';
import { fetchPlanningJson, isValidCoordinate } from './http';
import { CACHE_TTL, getOrCompute } from '@/lib/cache';
import type { GeoPoint } from './types';

const OSRM_BASE_URL = process.env.OSRM_BASE_URL ?? 'https://router.project-osrm.org';
const MAX_ROUTE_POINTS = 80;

/**
 * Road routing only makes sense for regional distances — cross-sea /
 * long-haul trips (typically originating from a different country) fly.
 * Beyond this straight-line distance the road route is either impossible
 * (oceans) or useless for planning, so it is skipped on the critical path.
 * Kept conservative: nothing is lost, the route section already degrades
 * honestly when absent.
 */
const MAX_ROAD_ROUTE_DISTANCE_KM = 1500;

function haversineKm(from: GeoPoint, to: GeoPoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(to.latitude - from.latitude);
  const dLon = toRad(to.longitude - from.longitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.latitude)) * Math.cos(toRad(to.latitude)) * Math.sin(dLon / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function shouldTryRoadRoute(from: GeoPoint, to: GeoPoint): boolean {
  if (from.latitude === to.latitude && from.longitude === to.longitude) return false;
  return haversineKm(from, to) <= MAX_ROAD_ROUTE_DISTANCE_KM;
}

interface OsrmRouteResponse {
  routes?: Array<{
    distance?: number;
    duration?: number;
    geometry?: { coordinates?: unknown };
  }>;
}

function compactGeometry(raw: unknown): RoutePlan['geometry'] {
  if (!Array.isArray(raw)) return [];

  const points = raw.flatMap((value) => {
    if (!Array.isArray(value) || value.length < 2) return [];
    const longitude = Number(value[0]);
    const latitude = Number(value[1]);
    return isValidCoordinate(latitude, longitude) ? [{ latitude, longitude }] : [];
  });

  if (points.length <= MAX_ROUTE_POINTS) return points;

  return Array.from({ length: MAX_ROUTE_POINTS }, (_, index) => {
    const sourceIndex = Math.round((index * (points.length - 1)) / (MAX_ROUTE_POINTS - 1));
    return points[sourceIndex];
  });
}

export async function findRoadRoute(
  from: GeoPoint,
  to: GeoPoint,
  kind: RoutePlan['kind'],
  day?: number
): Promise<RoutePlan | null> {
  // Long-haul / cross-sea trips never get a road route (flights instead) —
  // avoids a slow OSRM round trip on the generation critical path.
  if (!shouldTryRoadRoute(from, to)) return null;

  // Route metadata (distance/duration) is stable — cache per pair of points
  // so repeat trips skip the OSRM round trip entirely.
  const cacheParts = kind === 'arrival'
    ? ['arrival', from.latitude.toFixed(4), from.longitude.toFixed(4), to.latitude.toFixed(4), to.longitude.toFixed(4)]
    : ['daily', String(day ?? 0), from.latitude.toFixed(4), from.longitude.toFixed(4), to.latitude.toFixed(4), to.longitude.toFixed(4)];

  return await getOrCompute<RoutePlan>('routes', cacheParts, CACHE_TTL.routes, async () => {
    const url = new URL(
      `/route/v1/driving/${from.longitude},${from.latitude};${to.longitude},${to.latitude}`,
      OSRM_BASE_URL
    );
    url.searchParams.set('overview', 'full');
    url.searchParams.set('geometries', 'geojson');
    url.searchParams.set('steps', 'false');

    const response = await fetchPlanningJson<OsrmRouteResponse>(url, {}, 8_000);
    const route = response.routes?.[0];
    const geometry = compactGeometry(route?.geometry?.coordinates);
    const distanceMeters = Number(route?.distance);
    const durationSeconds = Number(route?.duration);

    if (!route || geometry.length < 2 || !Number.isFinite(distanceMeters) || !Number.isFinite(durationSeconds)) {
      return null;
    }

    return {
      kind,
      ...(day === undefined ? {} : { day }),
      distanceKm: Math.round((distanceMeters / 1_000) * 10) / 10,
      durationMinutes: Math.max(1, Math.round(durationSeconds / 60)),
      geometry,
    };
  });
}

export async function findDailyRoutes(
  days: Array<{ day: number; stops: GeoPoint[] }>
): Promise<RoutePlan[]> {
  const attempts = days
    .filter(({ stops }) => stops.length >= 2)
    .map(({ day, stops }) => findRoadRoute(stops[0], stops[stops.length - 1], 'daily', day));

  const results = await Promise.allSettled(attempts);
  return results.flatMap((result) => result.status === 'fulfilled' && result.value ? [result.value] : []);
}
