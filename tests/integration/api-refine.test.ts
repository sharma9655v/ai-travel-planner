import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/refine/route';
import { tokyoItinerary } from '../fixtures';

function refineRequest(body: unknown) {
  return new NextRequest('http://localhost:3000/api/refine', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/refine', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('validates the command', async () => {
    expect(
      (await POST(refineRequest({ itinerary: tokyoItinerary, command: '   ' }))).status
    ).toBe(400);
    expect(
      (await POST(refineRequest({ itinerary: tokyoItinerary, command: 'x'.repeat(301) }))).status
    ).toBe(400);
  });

  it('validates the itinerary payload', async () => {
    expect((await POST(refineRequest({ command: 'Replace Day 2' }))).status).toBe(400);
    expect((await POST(refineRequest({ command: 'Replace Day 2', itinerary: {} }))).status).toBe(
      400
    );
  });

  it('rejects oversized itineraries', async () => {
    const huge = {
      ...tokyoItinerary,
      tripSummary: { ...tokyoItinerary.tripSummary, destination: 'x'.repeat(450_000) },
    };
    const response = await POST(refineRequest({ command: 'hi', itinerary: huge }));
    expect(response.status).toBe(400);
    expect((await response.json()).error).toContain('large');
  });

  it('applies an edit and returns the merged itinerary', async () => {
    vi.stubEnv('NVIDIA_API_KEY', 'test-key');
    const edited = {
      ...tokyoItinerary,
      dailyItinerary: [
        tokyoItinerary.dailyItinerary[0],
        { ...tokyoItinerary.dailyItinerary[1], title: 'Museum Day' },
      ],
    };
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              choices: [
                { message: { content: JSON.stringify({ summary: 'Day 2 updated.', itinerary: edited }) } },
              ],
            }),
            { status: 200, headers: { 'content-type': 'application/json' } }
          )
      )
    );

    const response = await POST(refineRequest({ command: 'Replace Day 2', itinerary: tokyoItinerary }));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.changed).toBe(true);
    expect(body.summary).toBe('Day 2 updated.');
    expect(body.itinerary.dailyItinerary[1].title).toBe('Museum Day');
    expect(body.itinerary.dailyItinerary).toHaveLength(2);
  });

  it('degrades to 500 when the provider fails', async () => {
    vi.stubEnv('NVIDIA_API_KEY', 'test-key');
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 500 })));

    const response = await POST(
      refineRequest({ command: 'Replace Day 2', itinerary: tokyoItinerary })
    );
    expect(response.status).toBe(500);
  });

  it('returns 429 after the per-IP limit is hit', async () => {
    vi.resetModules();
    vi.stubEnv('NVIDIA_API_KEY', '');
    const fresh = await import('@/app/api/refine/route');

    let last: Response | null = null;
    for (let i = 0; i < 11; i++) {
      last = await fresh.POST(refineRequest({ command: 'x', itinerary: tokyoItinerary }));
    }
    expect(last?.status).toBe(429);
    expect(last?.headers.get('Retry-After')).toBe('60');
  });
});
