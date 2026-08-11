import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { enrichItinerary } from '@/lib/ai/enrich';
import { validateItinerary } from '@/lib/validation/schemas';
import { createDefaultQuestionnaireData } from '@/types/questionnaire';
import { tokyoItinerary } from '../fixtures';

// ============================================================
// Background enrichment tests — POST /api/enrich upgrades an already-
// generated itinerary with hotels, restaurants, events and daily routes.
// Enrichment must never be required: every provider is optional and the
// original itinerary stays fully usable on failure.
// ============================================================

const mocks = vi.hoisted(() => ({
  geocodeLocation: vi.fn(),
  findNearbyPlaces: vi.fn(),
  findHotels: vi.fn(),
  findRestaurants: vi.fn(),
  findEvents: vi.fn(),
  findDailyRoutes: vi.fn(),
}));

vi.mock('@/lib/planning/geocode', () => ({
  geocodeLocation: mocks.geocodeLocation,
}));

vi.mock('@/lib/planning/osm', () => ({
  findNearbyPlaces: mocks.findNearbyPlaces,
  findHotels: mocks.findHotels,
  findRestaurants: mocks.findRestaurants,
}));

vi.mock('@/lib/planning/events', () => ({
  findEvents: mocks.findEvents,
}));

vi.mock('@/lib/planning/routes', () => ({
  findRoadRoute: mocks.findDailyRoutes,
  findDailyRoutes: mocks.findDailyRoutes,
}));

function makeData() {
  const data = createDefaultQuestionnaireData();
  data.tripDetails = {
    startingLocation: 'Narita',
    destination: 'Tokyo',
    departureDate: '2026-10-01',
    returnDate: '2026-10-02',
    flexibleDates: false,
  };
  return data;
}

describe('enrichItinerary — background enrichment', () => {
  beforeEach(() => {
    vi.stubEnv('NVIDIA_API_KEY', 'test-key');
    mocks.geocodeLocation.mockReset();
    mocks.findNearbyPlaces.mockReset();
    mocks.findHotels.mockReset();
    mocks.findRestaurants.mockReset();
    mocks.findEvents.mockReset();
    mocks.findDailyRoutes.mockReset();

    mocks.geocodeLocation.mockResolvedValue({ latitude: 35.6762, longitude: 139.6503, label: 'Tokyo' });
    mocks.findNearbyPlaces.mockResolvedValue([]);
    mocks.findHotels.mockResolvedValue([]);
    mocks.findRestaurants.mockResolvedValue([]);
    mocks.findEvents.mockResolvedValue([]);
    mocks.findDailyRoutes.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('upgrades the itinerary with verified hotels, restaurants and events', async () => {
    mocks.findHotels.mockResolvedValue([
      {
        sourceId: 'osm:way:2',
        name: 'Shinjuku Grand Hotel',
        label: 'Shinjuku Grand Hotel',
        location: 'Shinjuku',
        latitude: 35.6938,
        longitude: 139.7034,
        category: 'accommodation',
        kind: 'hotel',
        amenities: ['WiFi'],
        starRating: 4,
      },
    ]);
    mocks.findRestaurants.mockResolvedValue([
      {
        sourceId: 'osm:way:4',
        name: 'Ichiran Shinjuku',
        label: 'Ichiran Shinjuku',
        location: 'Shinjuku',
        latitude: 35.694,
        longitude: 139.701,
        category: 'food',
        kind: 'restaurant',
        cuisine: 'Ramen',
        priceRange: 'Not listed',
        dietaryOptions: [],
      },
    ]);
    mocks.findEvents.mockResolvedValue([
      {
        sourceId: 'ticketmaster:1',
        name: 'Tokyo Jazz Night',
        label: 'Blue Note Tokyo',
        date: '2026-10-02',
        time: '20:30',
        latitude: 35.66,
        longitude: 139.7,
        category: 'nightlife',
      },
    ]);
    mocks.findDailyRoutes.mockResolvedValue([
      {
        kind: 'daily',
        day: 1,
        distanceKm: 1.2,
        durationMinutes: 15,
        geometry: [
          { latitude: 35.6595, longitude: 139.7005 },
          { latitude: 35.66, longitude: 139.705 },
        ],
      },
    ]);

    const enriched = await enrichItinerary(makeData(), tokyoItinerary);

    expect(enriched.accommodations[0].name).toBe('Shinjuku Grand Hotel');
    expect(enriched.restaurants[0].name).toBe('Ichiran Shinjuku');

    // The dated event lands on its matching day.
    const day2 = enriched.dailyItinerary.find((day) => day.day === 2);
    const event = day2?.activities.find((a) => a.name === 'Tokyo Jazz Night');
    expect(event).toBeDefined();
    expect(event?.time).toBe('20:30');

    // Daily routes survive into the validated contract.
    expect(enriched.routePlans?.some((route) => route.kind === 'daily')).toBe(true);

    // Reassembly must not lose any existing day or break the contract.
    expect(enriched.dailyItinerary).toHaveLength(2);
    expect(() => validateItinerary(enriched)).not.toThrow();
  });

  it('runs hotel, restaurant, event and route fetches concurrently', async () => {
    let resolveHotels!: (v: unknown[]) => void;
    let resolveRestaurants!: (v: unknown[]) => void;
    let resolveEvents!: (v: unknown[]) => void;
    let resolveRoutes!: (v: unknown[]) => void;

    mocks.findHotels.mockImplementation(() => new Promise((res) => { resolveHotels = res; }));
    mocks.findRestaurants.mockImplementation(() => new Promise((res) => { resolveRestaurants = res; }));
    mocks.findEvents.mockImplementation(() => new Promise((res) => { resolveEvents = res; }));
    mocks.findDailyRoutes.mockImplementation(() => new Promise((res) => { resolveRoutes = res; }));

    const run = enrichItinerary(makeData(), tokyoItinerary);

    await new Promise((res) => setTimeout(res, 0));
    await Promise.resolve();

    expect(mocks.findHotels).toHaveBeenCalledTimes(1);
    expect(mocks.findRestaurants).toHaveBeenCalledTimes(1);
    expect(mocks.findEvents).toHaveBeenCalledTimes(1);
    expect(mocks.findDailyRoutes).toHaveBeenCalledTimes(1);

    const stopsArg = mocks.findDailyRoutes.mock.calls[0][0] as { day: number; stops: unknown[] }[];
    expect(stopsArg.length).toBeGreaterThan(0);
    expect(stopsArg.every((entry) => entry.stops.length >= 2)).toBe(true);

    resolveHotels([]);
    resolveRestaurants([]);
    resolveEvents([]);
    resolveRoutes([]);

    const enriched = await run;
    expect(enriched.dailyItinerary).toHaveLength(2);
  });

  it('keeps the original itinerary fully usable when every enrichment provider fails', async () => {
    mocks.geocodeLocation.mockRejectedValue(new Error('nominatim down'));
    mocks.findHotels.mockRejectedValue(new Error('hotels down'));
    mocks.findRestaurants.mockRejectedValue(new Error('restaurants down'));
    mocks.findEvents.mockRejectedValue(new Error('events down'));
    mocks.findDailyRoutes.mockRejectedValue(new Error('routes down'));

    const enriched = await enrichItinerary(makeData(), tokyoItinerary);

    expect(() => validateItinerary(enriched)).not.toThrow();
    // Fallback anchors remain — never empty, never fabricated live data.
    expect(enriched.accommodations.length).toBeGreaterThan(0);
    expect(enriched.restaurants.length).toBeGreaterThan(0);
    // The original plan structure survives intact.
    expect(enriched.dailyItinerary).toHaveLength(2);
    expect(enriched.tripSummary.destination).toBe('Tokyo');
  });

  it('preserves the existing arrival route from the initial plan', async () => {
    const withArrival = {
      ...tokyoItinerary,
      routePlans: [
        {
          kind: 'arrival' as const,
          distanceKm: 42.5,
          durationMinutes: 55,
          geometry: [
            { latitude: 35.6595, longitude: 139.7005 },
            { latitude: 35.6683, longitude: 139.7671 },
          ],
        },
      ],
    };

    const enriched = await enrichItinerary(makeData(), withArrival);

    expect(enriched.transportationDetails.length).toBeGreaterThan(0);
    expect(enriched.routePlans?.some((route) => route.kind === 'arrival')).toBe(true);
    expect(() => validateItinerary(enriched)).not.toThrow();
  });
});