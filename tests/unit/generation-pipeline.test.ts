import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { generateItinerary } from '@/lib/ai/provider';
import { validateItinerary } from '@/lib/validation/schemas';
import { createDefaultQuestionnaireData } from '@/types/questionnaire';
import { weatherResponse } from '../fixtures';

// ============================================================
// Generation pipeline tests — verify the staged flow optimized for the
// FIRST USABLE ITINERARY:
//   questionnaire → [weather || places || arrival route] (parallel, cached)
//   → fast basic AI plan → deterministic assembly → validated itinerary
//
// Hotels / restaurants / events / daily routes are deliberately NOT part of
// the critical path anymore — they are fetched by POST /api/enrich in the
// background (see tests/unit/enrich.test.ts and tests/integration/api-enrich.test.ts).
// ============================================================

const basicPlan = {
  highlights: ['Shibuya', 'Senso-ji'],
  coverDescription: 'A quick Tokyo trip.',
  dailyItinerary: [
    {
      day: 1,
      date: '2026-10-01',
      title: 'Arrival & Shibuya',
      summary: 'Explore Shibuya.',
      activities: [
        {
          time: '16:00',
          endTime: '18:00',
          name: 'Shibuya Crossing',
          description: 'Watch the scramble crossing.',
          location: 'Shibuya',
          latitude: 35.6595,
          longitude: 139.7005,
          duration: '2 hours',
          category: 'sightseeing',
          estimatedCost: 0,
          tips: 'Go at sunset.',
        },
        {
          time: '19:00',
          endTime: '21:00',
          name: 'Tokyo Skytree',
          description: 'City views.',
          location: 'Sumida',
          latitude: 35.7101,
          longitude: 139.8107,
          duration: '2 hours',
          category: 'sightseeing',
          estimatedCost: 3000,
          tips: '',
        },
      ],
    },
    {
      day: 2,
      date: '2026-10-02',
      title: 'Asakusa',
      summary: 'Temples.',
      activities: [
        {
          time: '09:00',
          endTime: '11:00',
          name: 'Senso-ji Temple',
          description: 'Oldest temple.',
          location: 'Asakusa',
          latitude: 35.7148,
          longitude: 139.7967,
          duration: '2 hours',
          category: 'culture',
          estimatedCost: 0,
          tips: '',
        },
        {
          time: '14:00',
          endTime: '16:00',
          name: 'Tokyo National Museum',
          description: 'Japanese art.',
          location: 'Ueno',
          latitude: 35.7188,
          longitude: 139.7765,
          duration: '2 hours',
          category: 'culture',
          estimatedCost: 1000,
          tips: '',
        },
      ],
    },
  ],
  localCustoms: ['Bow when greeting'],
  travelTips: ['Get a Suica card'],
  importantNotes: ['No tipping'],
};

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

type Deferred<T> = { promise: Promise<T>; resolve: (value: T) => void; reject: (reason?: unknown) => void };

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const mocks = vi.hoisted(() => ({
  callNvidiaBasicItinerary: vi.fn(),
  geocodeLocation: vi.fn(),
  fetchWeatherForecast: vi.fn(),
  findNearbyPlaces: vi.fn(),
  findRoadRoute: vi.fn(),
  findHotels: vi.fn(),
  findRestaurants: vi.fn(),
  findEvents: vi.fn(),
  findDailyRoutes: vi.fn(),
}));

vi.mock('@/lib/ai/nvidia', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/ai/nvidia')>();
  return { ...actual, callNvidiaBasicItinerary: mocks.callNvidiaBasicItinerary };
});

vi.mock('@/lib/planning/geocode', () => ({
  geocodeLocation: mocks.geocodeLocation,
}));

vi.mock('@/lib/weather/service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/weather/service')>();
  return { ...actual, fetchWeatherForecast: mocks.fetchWeatherForecast };
});

vi.mock('@/lib/planning/osm', () => ({
  findNearbyPlaces: mocks.findNearbyPlaces,
  findHotels: mocks.findHotels,
  findRestaurants: mocks.findRestaurants,
}));

vi.mock('@/lib/planning/events', () => ({
  findEvents: mocks.findEvents,
}));

vi.mock('@/lib/planning/routes', () => ({
  findRoadRoute: mocks.findRoadRoute,
  findDailyRoutes: mocks.findDailyRoutes,
}));

describe('generateItinerary — staged pipeline', () => {
  beforeEach(() => {
    vi.stubEnv('NVIDIA_API_KEY', 'test-key');
    mocks.callNvidiaBasicItinerary.mockReset();
    mocks.geocodeLocation.mockReset();
    mocks.fetchWeatherForecast.mockReset();
    mocks.findNearbyPlaces.mockReset();
    mocks.findRoadRoute.mockReset();
    mocks.findHotels.mockReset();
    mocks.findRestaurants.mockReset();
    mocks.findEvents.mockReset();
    mocks.findDailyRoutes.mockReset();

    mocks.geocodeLocation.mockResolvedValue({ latitude: 35.6762, longitude: 139.6503, label: 'Tokyo' });
    mocks.fetchWeatherForecast.mockResolvedValue(weatherResponse);
    mocks.findNearbyPlaces.mockResolvedValue([]);
    mocks.findRoadRoute.mockResolvedValue(null);
    mocks.findHotels.mockResolvedValue([]);
    mocks.findRestaurants.mockResolvedValue([]);
    mocks.findEvents.mockResolvedValue([]);
    mocks.findDailyRoutes.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('starts weather, places and the arrival route concurrently (phase A)', async () => {
    const weather = deferred<typeof weatherResponse>();
    const places = deferred<unknown[]>();
    const arrival = deferred<unknown>();
    mocks.fetchWeatherForecast.mockReturnValue(weather.promise);
    mocks.findNearbyPlaces.mockReturnValue(places.promise);
    mocks.findRoadRoute.mockReturnValue(arrival.promise);
    mocks.callNvidiaBasicItinerary.mockReturnValue(Promise.resolve(JSON.stringify(basicPlan)));

    const run = generateItinerary(makeData());

    // Flush through the stage-0 geocode round and into stage 1.
    await new Promise((res) => setTimeout(res, 0));
    expect(mocks.geocodeLocation).toHaveBeenCalledTimes(2); // destination + origin
    expect(mocks.fetchWeatherForecast).toHaveBeenCalledTimes(1);
    expect(mocks.findNearbyPlaces).toHaveBeenCalledTimes(1);
    expect(mocks.findRoadRoute).toHaveBeenCalledTimes(1);

    // The AI call must wait for all three context providers to settle first.
    expect(mocks.callNvidiaBasicItinerary).not.toHaveBeenCalled();

    places.resolve([]);
    arrival.resolve(null);
    weather.resolve(weatherResponse);

    const itinerary = await run;
    expect(itinerary.dailyItinerary).toHaveLength(2);
  });

  it('returns the initial itinerary WITHOUT contacting enrichment providers (fast critical path)', async () => {
    mocks.callNvidiaBasicItinerary.mockResolvedValue(JSON.stringify(basicPlan));

    const run = generateItinerary(makeData());

    await new Promise((res) => setTimeout(res, 0));
    await Promise.resolve();
    await Promise.resolve();

    // AI result already produced a usable itinerary…
    const itinerary = await run;

    // …and the enrichment providers were never touched on the critical path.
    expect(mocks.findHotels).not.toHaveBeenCalled();
    expect(mocks.findRestaurants).not.toHaveBeenCalled();
    expect(mocks.findEvents).not.toHaveBeenCalled();
    expect(mocks.findDailyRoutes).not.toHaveBeenCalled();

    expect(itinerary.dailyItinerary).toHaveLength(2);
    // Honest deterministic fallbacks — the plan is complete without enrichment.
    expect(itinerary.accommodations.length).toBeGreaterThan(0);
    expect(itinerary.restaurants.length).toBeGreaterThan(0);
    expect(() => validateItinerary(itinerary)).not.toThrow();
  });

  it('degrades gracefully when every context provider fails', async () => {
    mocks.callNvidiaBasicItinerary.mockResolvedValue(JSON.stringify(basicPlan));
    mocks.fetchWeatherForecast.mockRejectedValue(new Error('upstream down'));
    mocks.findNearbyPlaces.mockRejectedValue(new Error('overpass down'));
    mocks.findRoadRoute.mockRejectedValue(new Error('osrm down'));

    const itinerary = await generateItinerary(makeData());

    // Still a fully valid itinerary, with honest fallbacks, never fake data.
    expect(() => validateItinerary(itinerary)).not.toThrow();
    expect(itinerary.tripSummary.destination).toBe('Tokyo');
    expect(itinerary.dailyItinerary).toHaveLength(2);
    expect(itinerary.weatherForecast).toBeUndefined();
    // Deterministic fallback entries instead of empty/fabricated sections.
    expect(itinerary.accommodations.length).toBeGreaterThan(0);
    expect(itinerary.restaurants.length).toBeGreaterThan(0);
  });

  it('snaps activities to verified OSM place coordinates from the critical-path context', async () => {
    mocks.callNvidiaBasicItinerary.mockResolvedValue(JSON.stringify(basicPlan));
    mocks.findNearbyPlaces.mockResolvedValue([
      {
        sourceId: 'osm:way:1',
        name: 'Senso-ji Temple',
        label: 'Senso-ji Temple',
        location: 'Asakusa',
        latitude: 35.7148,
        longitude: 139.7967,
        category: 'culture',
        kind: 'temple',
      },
    ]);

    const itinerary = await generateItinerary(makeData());

    // Day-1 places come straight from the AI plan; day-2 names snap to the
    // verified OSM candidate coordinates.
    const day2 = itinerary.dailyItinerary.find((day) => day.day === 2);
    const temple = day2?.activities.find((a) => a.name === 'Senso-ji Temple');
    expect(temple?.latitude).toBeCloseTo(35.7148, 3);
    expect(() => validateItinerary(itinerary)).not.toThrow();
  });

  it('propagates the error when the AI returns garbage twice', async () => {
    mocks.callNvidiaBasicItinerary.mockResolvedValue('no json here at all');
    await expect(generateItinerary(makeData())).rejects.toThrow();
  });

  it('normalizes a day list wrapped in an extra object', async () => {
    mocks.callNvidiaBasicItinerary.mockResolvedValue(
      JSON.stringify({ itinerary: { dailyItinerary: basicPlan.dailyItinerary } })
    );

    const itinerary = await generateItinerary(makeData());

    expect(itinerary.dailyItinerary).toHaveLength(2);
    expect(() => validateItinerary(itinerary)).not.toThrow();
  });

  it('normalizes a day map with numeric keys', async () => {
    mocks.callNvidiaBasicItinerary.mockResolvedValue(
      JSON.stringify({
        dailyItinerary: {
          1: basicPlan.dailyItinerary[0],
          2: basicPlan.dailyItinerary[1],
        },
      })
    );

    const itinerary = await generateItinerary(makeData());

    expect(itinerary.dailyItinerary).toHaveLength(2);
    expect(itinerary.dailyItinerary[0].activities[0].name).toBe('Shibuya Crossing');
    expect(() => validateItinerary(itinerary)).not.toThrow();
  });

  it('normalizes a bare day array (no wrapper object)', async () => {
    mocks.callNvidiaBasicItinerary.mockResolvedValue(
      JSON.stringify(basicPlan.dailyItinerary)
    );

    const itinerary = await generateItinerary(makeData());

    expect(itinerary.dailyItinerary).toHaveLength(2);
    expect(() => validateItinerary(itinerary)).not.toThrow();
  });

  it('still fails clearly when the day list is genuinely absent', async () => {
    mocks.callNvidiaBasicItinerary.mockResolvedValue(
      JSON.stringify({ hello: 'world' })
    );

    await expect(generateItinerary(makeData())).rejects.toThrow(
      /malformed itinerary/
    );
  });
});