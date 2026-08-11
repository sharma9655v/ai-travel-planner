import type { TravelItinerary } from '@/types/itinerary';

// Weather anchor: the first activity with real coordinates in the plan.
// No coordinates → null (we never fabricate a forecast).
export function getWeatherAnchorCoords(
  itinerary: TravelItinerary | null | undefined
): { latitude: number; longitude: number } | null {
  const activities = itinerary?.dailyItinerary?.flatMap((day) => day.activities ?? []) ?? [];
  const spot = activities.find(
    (a) =>
      Number.isFinite(a?.latitude) &&
      Number.isFinite(a?.longitude) &&
      (Math.abs(a.latitude) > 0.0001 || Math.abs(a.longitude) > 0.0001)
  );
  return spot ? { latitude: spot.latitude, longitude: spot.longitude } : null;
}
