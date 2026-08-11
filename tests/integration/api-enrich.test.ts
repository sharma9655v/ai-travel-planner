import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/enrich/route';
import { createDefaultQuestionnaireData } from '@/types/questionnaire';
import { tokyoItinerary } from '../fixtures';

// POST /api/enrich is OPTIONAL by design: it upgrades an already-generated
// itinerary in the background. These tests pin the failure semantics — the
// route must never make enrichment a requirement.

const enrichMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/ai/enrich', () => ({
  enrichItinerary: enrichMock,
}));

function validBody() {
  return {
    tripId: 'abc123def456',
    questionnaire: {
      ...createDefaultQuestionnaireData(),
      tripDetails: {
        ...createDefaultQuestionnaireData().tripDetails,
        destination: 'Tokyo',
        departureDate: '2026-10-01',
        returnDate: '2026-10-02',
      },
    },
    itinerary: tokyoItinerary,
  };
}

function enrichRequest(body: unknown) {
  return new Request('http://localhost:3000/api/enrich', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/enrich', () => {
  afterEach(() => {
    enrichMock.mockReset();
    vi.unstubAllGlobals();
  });

  it('rejects requests without an itinerary', async () => {
    vi.stubEnv('NVIDIA_API_KEY', 'test-key');
    const response = await POST(enrichRequest({}));
    expect(response.status).toBe(400);
  });

  it('rejects malformed itineraries', async () => {
    vi.stubEnv('NVIDIA_API_KEY', 'test-key');
    const response = await POST(
      enrichRequest({ ...validBody(), itinerary: { tripSummary: {} } })
    );
    expect(response.status).toBe(400);
  });

  it('rejects requests without a valid questionnaire', async () => {
    vi.stubEnv('NVIDIA_API_KEY', 'test-key');
    const response = await POST(enrichRequest({ ...validBody(), questionnaire: { nope: true } }));
    expect(response.status).toBe(400);
  });

  it('returns the enriched itinerary on success', async () => {
    vi.stubEnv('NVIDIA_API_KEY', 'test-key');
    enrichMock.mockResolvedValue({ ...tokyoItinerary, tripSummary: { ...tokyoItinerary.tripSummary } });

    const response = await POST(enrichRequest(validBody()));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.id).toBe('abc123def456');
    expect(body.itinerary.tripSummary.destination).toBe('Tokyo');
  });

  it('enrichment failure keeps failing softly with a client-safe error', async () => {
    vi.stubEnv('NVIDIA_API_KEY', 'test-key');
    enrichMock.mockRejectedValue(new Error('overpass down'));

    const response = await POST(enrichRequest(validBody()));
    expect(response.status).toBe(500);
    const body = await response.json();
    // Production-safe copy — the client ignores it and keeps the original plan.
    expect(body.error).toContain('Enrichment failed');
  });
});