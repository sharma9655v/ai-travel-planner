import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/weather/route';
import type { OpenMeteoDaily } from '@/lib/weather/map';

function weatherRequest(query: string) {
  return new NextRequest(`http://localhost:3000/api/weather${query}`);
}

function openMeteoPayload(days = 3) {
  const time = Array.from({ length: days }, (_, i) => `2026-10-0${i + 1}`);
  return {
    current: {
      temperature_2m: 23.6,
      apparent_temperature: 22.1,
      weather_code: 2,
      wind_speed_10m: 6.2,
      relative_humidity_2m: 55.5,
      precipitation: 0.4,
      is_day: true,
    },
    daily: {
      time,
      weather_code: time.map(() => 0),
      temperature_2m_max: time.map(() => 24.4),
      temperature_2m_min: time.map(() => 12.3),
      precipitation_probability_max: time.map(() => 10),
      wind_speed_10m_max: time.map(() => 5),
      relative_humidity_2m_max: time.map(() => 44.4),
    } satisfies OpenMeteoDaily,
  };
}

describe('GET /api/weather', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('returns a mapped forecast for valid coordinates', async () => {
    const fetchMock = vi.fn<(input: RequestInfo | URL) => Promise<Response>>(
      async () => new Response(JSON.stringify(openMeteoPayload(3)), { status: 200 })
    );
    vi.stubGlobal('fetch', fetchMock);

    const response = await GET(weatherRequest('?lat=35.68&lon=139.69&days=3'));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.forecast).toHaveLength(3);
    expect(body.current.condition).toBe('Clouds');
    expect(body.current.temperature).toBe(24);
    expect(Array.isArray(body.alerts)).toBe(true);
    expect(body.updatedAt).toBeTruthy();

    const url = new URL(String(fetchMock.mock.calls[0][0]));
    expect(url.searchParams.get('forecast_days')).toBe('3');
    expect(url.searchParams.get('timezone')).toBe('auto');
  });

  it('clamps the requested days to the 1..16 range', async () => {
    const fetchMock = vi.fn<(input: RequestInfo | URL) => Promise<Response>>(
      async () => new Response(JSON.stringify(openMeteoPayload(16)), { status: 200 })
    );
    vi.stubGlobal('fetch', fetchMock);

    await GET(weatherRequest('?lat=35.68&lon=139.69&days=999'));
    await GET(weatherRequest('?lat=35.68&lon=139.69&days=0'));
    await GET(weatherRequest('?lat=35.68&lon=139.69&days=notanumber'));

    const requested = fetchMock.mock.calls.map(
      (call) => new URL(String(call[0])).searchParams.get('forecast_days')
    );
    expect(requested).toEqual(['16', '7', '7']);
  });

  it('rejects invalid coordinates without calling upstream', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    expect((await GET(weatherRequest('?lat=91&lon=0'))).status).toBe(400);
    expect((await GET(weatherRequest('?lat=0&lon=-181'))).status).toBe(400);
    expect((await GET(weatherRequest('?lat=abc&lon=10'))).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('degrades to 502 when the upstream fails or returns no forecast', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('boom', { status: 500 })));
    const failed = await GET(weatherRequest('?lat=35&lon=139'));
    expect(failed.status).toBe(502);
    expect((await failed.json()).error).toContain('unavailable');

    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({}), { status: 200 })));
    const empty = await GET(weatherRequest('?lat=35&lon=139'));
    expect(empty.status).toBe(502);
    expect((await empty.json()).error).toContain('no forecast');
  });

  it('returns 429 after the per-IP limit is hit', async () => {
    vi.resetModules();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify(openMeteoPayload(1)), { status: 200 }))
    );
    const fresh = await import('@/app/api/weather/route');

    let last: Response | null = null;
    for (let i = 0; i < 31; i++) {
      last = await fresh.GET(weatherRequest('?lat=35&lon=139'));
    }
    expect(last?.status).toBe(429);
    expect(last?.headers.get('Retry-After')).toBe('60');
  });
});
