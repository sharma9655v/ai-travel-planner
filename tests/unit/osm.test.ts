import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { findNearbyPlaces } from '@/lib/planning/osm';
import type { GeoPoint } from '@/lib/planning/types';

const POINT: GeoPoint = { latitude: 15.3005, longitude: 74.0855, label: 'Goa' };
// Dedicated coordinates per cache test â€” the in-memory cache is shared
// process-wide, so tests must not reuse coordinates or they pollute each other.
const CACHE_POINT_A: GeoPoint = { latitude: 15.3052, longitude: 74.0858, label: 'Goa A' };
const CACHE_POINT_B: GeoPoint = { latitude: 15.3152, longitude: 74.0958, label: 'Goa B' };
const CACHE_POINT_C: GeoPoint = { latitude: 15.3252, longitude: 74.1058, label: 'Goa C' };
const CACHE_POINT_D: GeoPoint = { latitude: 15.3352, longitude: 74.1158, label: 'Goa D' };
const CACHE_POINT_E: GeoPoint = { latitude: 15.3452, longitude: 74.1258, label: 'Goa E' };
const PRIMARY_URL = 'https://overpass-api.de/api/interpreter';

let fetchMock: ReturnType<typeof vi.fn>;

function requestAt(index: number): RequestInit {
  const [, init] = fetchMock.mock.calls[index] as unknown as [string, RequestInit];
  return init;
}

function okResponse(elements: unknown[]): Response {
  return new Response(JSON.stringify({ elements }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  vi.stubEnv('NODE_ENV', 'test');
  // A fresh Response per call — a Response body is single-use, reusing one
  // instance across calls makes the second read throw.
  fetchMock.mockImplementation(() => Promise.resolve(okResponse([])));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('queryOverpass via findNearbyPlaces', () => {
  it('POSTs to the Overpass interpreter with an identifying User-Agent', async () => {
    await findNearbyPlaces(POINT);

    const [input, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(input).toBe(PRIMARY_URL);
    expect(init.method).toBe('POST');
    const headers = new Headers(init.headers);
    expect(headers.get('content-type')).toContain('application/x-www-form-urlencoded');
    expect(headers.get('user-agent')).toContain('ai-travel-planner');
  });

  it('returns candidates from the primary instance', async () => {
    fetchMock.mockResolvedValue(
      okResponse([
        { type: 'node', id: 1, lat: 15.3005, lon: 74.0855, tags: { tourism: 'museum', name: 'Museum A' } },
      ])
    );

    const places = await findNearbyPlaces(POINT);

    expect(places).toHaveLength(1);
    expect(places[0].name).toBe('Museum A');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('falls back to the configured instance when the primary fails', async () => {
    vi.stubEnv('OVERPASS_FALLBACK_URL', 'https://overpass.example.com/api/interpreter');
    fetchMock
      .mockResolvedValueOnce(new Response('{}', { status: 406 }))
      .mockResolvedValueOnce(
        okResponse([
          { type: 'node', id: 2, lat: 15.3005, lon: 74.0855, tags: { tourism: 'museum', name: 'Museum B' } },
        ])
      );

    const places = await findNearbyPlaces(POINT);

    expect(places).toHaveLength(1);
    expect(places[0].name).toBe('Museum B');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const fallbackInput = fetchMock.mock.calls[1][0];
    expect(fallbackInput).toBe('https://overpass.example.com/api/interpreter');
    expect(requestAt(1).method).toBe('POST');
  });

  it('propagates the provider failure when no fallback is configured', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 406 }));

    await expect(findNearbyPlaces(POINT)).rejects.toThrow(/406/);
  });
});

describe('Overpass result caching (CACHE_ENABLED=true)', () => {
  beforeEach(() => {
    vi.stubEnv('CACHE_ENABLED', 'true');
  });

  it('caches the first success: miss on the first call, hit on the second', async () => {
    fetchMock.mockResolvedValue(
      okResponse([
        { type: 'node', id: 10, lat: 15.3005, lon: 74.0855, tags: { tourism: 'museum', name: 'Museum A' } },
      ])
    );
    await findNearbyPlaces(CACHE_POINT_A);
    await findNearbyPlaces(CACHE_POINT_A);

// One upstream request served both calls, the second came from cache.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('uses a coordinate-based key: a different destination is a fresh miss', async () => {
    // Fresh Response per call — the Response body is single-use.
    fetchMock.mockImplementation(() => Promise.resolve(okResponse([])));

    await findNearbyPlaces(POINT);
    await findNearbyPlaces(CACHE_POINT_B);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('never caches failed responses', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response('{}', { status: 406 }))
      .mockResolvedValue(
        okResponse([
          { type: 'node', id: 11, lat: 15.3005, lon: 74.0855, tags: { tourism: 'museum', name: 'Museum B' } },
        ])
      );

    // The failing response must not be cached as "places = empty".
    await expect(findNearbyPlaces(CACHE_POINT_C)).rejects.toThrow(/406/);
    const places = await findNearbyPlaces(CACHE_POINT_C);

    expect(places).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('serves the same POI payload from cache (coordinate-keyed, no user data)', async () => {
    fetchMock.mockResolvedValue(
      okResponse([
        { type: 'node', id: 12, lat: 15.3005, lon: 74.0855, tags: { tourism: 'museum', name: 'Museum C' } },
      ])
    );

    const first = await findNearbyPlaces(CACHE_POINT_D);
    const second = await findNearbyPlaces(CACHE_POINT_D);

    expect(first).toEqual(second);
    expect(second[0].name).toBe('Museum C');
  });

  it('deduplicates concurrent requests for the same destination', async () => {
    // Slow upstream: two simultaneous requests for the same coordinates
    // must share one Overpass call, not issue two.
    fetchMock.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve(
                okResponse([
                  { type: 'node', id: 13, lat: 15.3005, lon: 74.0855, tags: { tourism: 'museum', name: 'Museum D' } },
                ])
              ),
            30
          )
        )
    );

    const [first, second] = await Promise.all([
      findNearbyPlaces(CACHE_POINT_E),
      findNearbyPlaces(CACHE_POINT_E),
    ]);

    expect(first).toEqual(second);
    expect(second[0].name).toBe('Museum D');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

