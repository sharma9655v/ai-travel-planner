import { createDefaultQuestionnaireData } from '@/types/questionnaire';

// ============================================================
// Performance measurement script (development tooling).
//
// Usage: start the app server, then:
//   npm run measure:generation
//
// Times POST /api/generate (first usable itinerary) and POST /api/enrich
// (background hotels/restaurants/events/routes) separately. Run it twice:
// the first run measures COLD cache, the second WARM cache.
// ============================================================

const BASE_URL = process.env.MEASURE_URL ?? 'http://localhost:3010';
const DESTINATION = process.env.MEASURE_DESTINATION ?? 'Dubai';

function makePayload() {
  const data = createDefaultQuestionnaireData();
  data.tripDetails = {
    startingLocation: 'Mumbai',
    destination: DESTINATION,
    departureDate: '2026-11-20',
    returnDate: '2026-11-22',
    flexibleDates: false,
  };
  data.style = { travelStyle: 'mid-range', travelPace: 'balanced' };
  data.interests = { interests: ['historical', 'museums', 'local-culture'] };
  return data;
}

async function timedFetch(url: string, init: RequestInit): Promise<{ durationMs: number; status: number; body: any }> {
  const startedAt = Date.now();
  const response = await fetch(url, init);
  const body = await response.json().catch(() => ({}));
  return { durationMs: Date.now() - startedAt, status: response.status, body };
}

async function main(): Promise<void> {
  const questionnaire = makePayload();

  console.log(`[measure] target=${BASE_URL} destination=${DESTINATION}\n`);

  // 1. Initial itinerary — the number the user actually waits for.
  const generate = await timedFetch(`${BASE_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(questionnaire),
  });

  if (generate.status !== 200) {
    console.error('[measure] /api/generate failed:', generate.status, JSON.stringify(generate.body).slice(0, 300));
    process.exit(1);
  }

  console.log(`[measure] FIRST USABLE ITINERARY  -> ${(generate.durationMs / 1000).toFixed(2)}s (status ${generate.status})`);
  console.log(`[measure]   days: ${generate.body.itinerary?.dailyItinerary?.length ?? '?'}, accommodations: ${generate.body.itinerary?.accommodations?.length ?? '?'}, restaurants: ${generate.body.itinerary?.restaurants?.length ?? '?'}`);

  // 2. Background enrichment — runs AFTER the user already sees the plan.
  const enrich = await timedFetch(`${BASE_URL}/api/enrich`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tripId: generate.body.id,
      questionnaire,
      itinerary: generate.body.itinerary,
    }),
  });

  if (enrich.status !== 200) {
    console.error('[measure] /api/enrich failed:', enrich.status, JSON.stringify(enrich.body).slice(0, 300));
  } else {
    console.log(`[measure] FULL ENRICHMENT         -> ${(enrich.durationMs / 1000).toFixed(2)}s (status ${enrich.status})`);
    console.log(`[measure]   accommodations: ${enrich.body.itinerary?.accommodations?.length ?? '?'}, restaurants: ${enrich.body.itinerary?.restaurants?.length ?? '?'}, routePlans: ${enrich.body.itinerary?.routePlans?.length ?? '?'}`);
  }

  const totalWork = generate.durationMs + enrich.durationMs;
  console.log(`\n[measure] OLD single-request equivalent: ~${(totalWork / 1000).toFixed(2)}s (generate + enrichment in one request)`);
}

main().catch((error) => {
  console.error('[measure] fatal:', error);
  process.exit(1);
});