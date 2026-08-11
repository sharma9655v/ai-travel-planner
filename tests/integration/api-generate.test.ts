import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/generate/route';
import { createDefaultQuestionnaireData } from '@/types/questionnaire';
import { tokyoItinerary } from '../fixtures';

const validBody = {
  ...createDefaultQuestionnaireData(),
  tripDetails: {
    ...createDefaultQuestionnaireData().tripDetails,
    destination: 'Tokyo',
    departureDate: '2026-10-01',
  },
};

function generateRequest(body: unknown) {
  return new Request('http://localhost:3000/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/generate', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('rejects requests without destination or dates', async () => {
    vi.stubEnv('NVIDIA_API_KEY', 'test-key');
    expect((await POST(generateRequest({ tripDetails: {} }))).status).toBe(400);
    expect(
      (await POST(generateRequest({ tripDetails: { destination: 'Tokyo' } }))).status
    ).toBe(400);
  });

  it('rejects oversized request bodies', async () => {
    vi.stubEnv('NVIDIA_API_KEY', 'test-key');
    const body = {
      ...validBody,
      tripDetails: { ...validBody.tripDetails, destination: 'x'.repeat(60_000) },
    };
    const response = await POST(generateRequest(body));
    expect(response.status).toBe(400);
    expect((await response.json()).error).toContain('large');
  });

  it('returns 500 when the AI key is missing', async () => {
    vi.stubEnv('NVIDIA_API_KEY', '');
    const response = await POST(generateRequest(validBody));
    expect(response.status).toBe(500);
    // Development surfaces the real cause instead of the generic copy.
    expect((await response.json()).error).toContain('NVIDIA_API_KEY');
  });

  it('surfaces the real provider error in development', async () => {
    vi.resetModules(); // fresh rate limiter — no slot budget to spend
    vi.stubEnv('NVIDIA_API_KEY', 'test-key');
    const fresh = await import('@/app/api/generate/route');
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ error: { message: 'Provider overloaded, retry soon.' } }), {
            status: 500,
          })
      )
    );

    const response = await fresh.POST(generateRequest(validBody));
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toContain('overloaded');
  });

  it('returns the generic 500 copy in production', async () => {
    vi.resetModules(); // fresh rate limiter — no slot budget to spend
    vi.stubEnv('NVIDIA_API_KEY', 'test-key');
    vi.stubEnv('NODE_ENV', 'production');
    const fresh = await import('@/app/api/generate/route');
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ error: { message: 'Provider overloaded, retry soon.' } }), {
            status: 500,
          })
      )
    );

    const response = await fresh.POST(generateRequest(validBody));
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe('Generation failed. Please try again.');
  });

  it('returns a generated itinerary with a short id', async () => {
    vi.stubEnv('NVIDIA_API_KEY', 'test-key');
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({ choices: [{ message: { content: JSON.stringify(tokyoItinerary) } }] }),
            { status: 200, headers: { 'content-type': 'application/json' } }
          )
      )
    );

    const response = await POST(generateRequest(validBody));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.id).toMatch(/^[0-9a-f]{12}$/);
    expect(body.message).toBe('Itinerary generated successfully');
    expect(body.itinerary.tripSummary.destination).toBe('Tokyo');
    expect(body.itinerary.dailyItinerary).toHaveLength(2);
    expect(body.itinerary.budgetBreakdown.currency).toBe('JPY');
  });

  it('returns 429 after the per-IP limit is hit', async () => {
    vi.resetModules();
    vi.stubEnv('NVIDIA_API_KEY', '');
    const fresh = await import('@/app/api/generate/route');

    let last: Response | null = null;
    for (let i = 0; i < 6; i++) {
      last = await fresh.POST(generateRequest(validBody));
    }
    expect(last?.status).toBe(429);
    expect(last?.headers.get('Retry-After')).toBe('60');
  });
});
