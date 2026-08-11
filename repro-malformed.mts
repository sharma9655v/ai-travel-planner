import { callNvidiaBasicItinerary, parseAIResponse } from './src/lib/ai/nvidia';
import { validateBasicItinerary } from './src/lib/planning/basicSchema';
import { createDefaultQuestionnaireData } from './src/types/questionnaire';
import { buildGenerationDigest } from './src/lib/planning/digest';

const data = createDefaultQuestionnaireData();
data.tripDetails = {
  startingLocation: 'Mumbai',
  destination: 'Goa',
  departureDate: '2026-11-20',
  returnDate: '2026-11-22',
  flexibleDates: false,
};
data.style = { travelStyle: 'mid-range', travelPace: 'balanced' };
data.interests = { interests: ['historical', 'museums', 'local-culture'] };

const digest = buildGenerationDigest({ destination: null, weather: null, places: [], arrivalRoute: null });

function shapeSummary(value: unknown, depth = 0): unknown {
  if (depth > 3) return typeof value;
  if (Array.isArray(value)) {
    return value.length === 0 ? '[]' : value.slice(0, 3).map((v) => shapeSummary(v, depth + 1));
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>).slice(0, 12)) {
      out[k] = shapeSummary(v, depth + 1);
    }
    return out;
  }
  return typeof value;
}

(async () => {
  for (let i = 1; i <= 6; i++) {
    const t0 = Date.now();
    try {
      const raw = await callNvidiaBasicItinerary(data, digest);
      const parsed = parseAIResponse(raw) as Record<string, unknown>;
      const days = Array.isArray(parsed.dailyItinerary) ? parsed.dailyItinerary : parsed.dailyItinerary;
      let valid = true;
      try {
        validateBasicItinerary(parsed);
      } catch (e) {
        valid = false;
      }
      console.log(
        JSON.stringify({
          iter: i,
          ok: valid,
          durationMs: Date.now() - t0,
          topKeys: Object.keys(parsed),
          days: Array.isArray(days) ? days.length : typeof days,
          daysKeys: Array.isArray(days) ? (days[0] ? Object.keys(days[0] as object) : []) : [],
        })
      );
      if (!valid) {
        console.log('SHAPE:' + JSON.stringify(shapeSummary(parsed)));
      }
    } catch (error) {
      console.log(
        JSON.stringify({
          iter: i,
          ok: false,
          durationMs: Date.now() - t0,
          error: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
        })
      );
    }
  }
})();