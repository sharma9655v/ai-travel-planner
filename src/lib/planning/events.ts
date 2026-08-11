import type { ActivityCategory } from '@/types/itinerary';
import { fetchPlanningJson, isValidCoordinate } from './http';
import type { EventCandidate, GeoPoint } from './types';

const TICKETMASTER_URL = 'https://app.ticketmaster.com/discovery/v2/events.json';

interface TicketmasterEvent {
  id?: string;
  name?: string;
  dates?: { start?: { localDate?: string; localTime?: string } };
  classifications?: Array<{ segment?: { name?: string } }>;
  _embedded?: {
    venues?: Array<{
      name?: string;
      location?: { latitude?: string; longitude?: string };
    }>;
  };
}

interface TicketmasterResponse {
  _embedded?: { events?: TicketmasterEvent[] };
}

function categoryFor(segment: string | undefined): ActivityCategory {
  switch (segment?.toLowerCase()) {
    case 'music':
      return 'nightlife';
    case 'sports':
      return 'adventure';
    default:
      return 'culture';
  }
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

// Ticketmaster is optional because it requires an API key. Without one we
// intentionally return no dated events rather than inventing recommendations.
export async function findEvents(
  point: GeoPoint,
  departureDate: string,
  returnDate: string
): Promise<EventCandidate[]> {
  const apiKey = process.env.TICKETMASTER_API_KEY;
  if (!apiKey || !isIsoDate(departureDate) || !isIsoDate(returnDate || departureDate)) return [];

  const endDate = returnDate || departureDate;
  const url = new URL(TICKETMASTER_URL);
  url.searchParams.set('apikey', apiKey);
  url.searchParams.set('latlong', `${point.latitude},${point.longitude}`);
  url.searchParams.set('radius', '20');
  url.searchParams.set('unit', 'km');
  url.searchParams.set('startDateTime', `${departureDate}T00:00:00Z`);
  url.searchParams.set('endDateTime', `${endDate}T23:59:59Z`);
  url.searchParams.set('size', '10');

  const response = await fetchPlanningJson<TicketmasterResponse>(url, {}, 8_000);
  const seen = new Set<string>();

  return (response._embedded?.events ?? []).flatMap((event) => {
    const venue = event._embedded?.venues?.[0];
    const latitude = Number(venue?.location?.latitude);
    const longitude = Number(venue?.location?.longitude);
    const id = event.id?.trim();
    const name = event.name?.trim();
    const date = event.dates?.start?.localDate;

    if (!id || !name || !date || seen.has(id)) return [];
    seen.add(id);

    return [{
      sourceId: `ticketmaster:${id}`,
      name: name.slice(0, 180),
      date,
      time: event.dates?.start?.localTime,
      label: venue?.name?.slice(0, 160) || point.label,
      latitude: isValidCoordinate(latitude, longitude) ? latitude : 0,
      longitude: isValidCoordinate(latitude, longitude) ? longitude : 0,
      category: categoryFor(event.classifications?.[0]?.segment?.name),
    }];
  });
}
