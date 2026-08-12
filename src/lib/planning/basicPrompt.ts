import type { QuestionnaireData } from '@/types/questionnaire';

// ============================================================
// Fast basic-itinerary prompt. The model returns ONLY a day-by-day
// skeleton (activities with times, names, coordinates, category).
// Everything else — hotels, restaurants, events, routes, budget,
// weather — is added by the deterministic enrichment stage.
// ============================================================

export const BASIC_ITINERARY_SCHEMA = `{
  "highlights": ["string"],
  "coverDescription": "string",
  "dailyItinerary": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "title": "string",
      "summary": "string",
      "activities": [
        {
          "time": "HH:MM",
          "endTime": "HH:MM",
          "name": "string",
          "description": "string (0-1 short sentence, max 12 words, concise and factual)",
          "location": "string (place name only, max 4 words, NEVER include coordinates)",
          "latitude": 0,
          "longitude": 0,
          "duration": "string",
          "category": "sightseeing | food | transport | accommodation | adventure | shopping | relaxation | culture | nightlife | wellness",
          "estimatedCost": 0,
          "tips": "string (optional; if present max 6 words, short actionable phrase)"
        }
      ]
    }
  ],
  "localCustoms": ["string"],
  "travelTips": ["string"],
  "importantNotes": ["string"]
}`;

export function buildBasicSystemPrompt(): string {
  return `You are an expert travel planner AI. Outline a personalized daily plan as a single JSON object.

CRITICAL OUTPUT RULES:
- Respond with ONLY valid JSON. No markdown, no commentary, no code fences.
- The JSON object must contain the "dailyItinerary" array at the TOP LEVEL of the response — no wrapper object, no nested keys.
- Do NOT use \`\`\`json code fences or backticks around the JSON.
- Do NOT add explanations, headings, or text before or after the JSON object.
- JSON must be complete and well-formed: no trailing commas, no comments, no missing closing braces.
- Every string must be valid JSON (escaped quotes, no raw newlines inside strings).
- Do NOT truncate the itinerary. All planned days must be present.
- This is a FAST outline pass: the full itinerary (hotels, restaurants, events, routes, weather, budget) is assembled separately. Do NOT include hotels, restaurants, events, budget breakdown, packing lists, or route data here.
- 3-4 activities per day (not more).
- EVERY activity needs realistic latitude/longitude coordinates for the destination area.
- When the context lists real places, prefer their names and coordinates when they fit the day.
- ALL numeric fields must be numbers (use 0 for unknown costs).
- 3-5 travel tips max.
- KEEP OUTPUT TEXT MINIMAL to fit the token budget:
  - description: exactly 0-1 short sentence, maximum 12 words, concise and factual (e.g. "Historic temple known for traditional architecture."). Never write multi-sentence explanations.
  - location: place name only, maximum 4 words. NEVER include coordinates inside location — latitude/longitude live exclusively in the numeric fields (e.g. "Rạp Phim Bạch Mai", not "Rạp Phim Bạch Mai (20.9981, 105.8504)").
  - tips: OPTIONAL. If provided, maximum 6 words as a short actionable phrase (e.g. "Book tickets early", "Carry water", "Reserve ahead"). Omit the field entirely when there is nothing useful to add. Never write full-sentence tips.

JSON SCHEMA (follow exactly):

${BASIC_ITINERARY_SCHEMA}`;
}

export function buildBasicUserPrompt(
  data: QuestionnaireData,
  contextDigest: string
): string {
  return `Create a day-by-day outline for a trip to ${data.tripDetails.destination}.
Dates: ${data.tripDetails.departureDate} to ${data.tripDetails.returnDate}
Budget: ${data.budget.totalBudget} ${data.budget.currency}
Companions: ${data.travelers.groupSize} people (${data.travelers.tripType})
Travel Style: ${data.style.travelStyle}, Pace: ${data.style.travelPace}
Interests: ${data.interests.interests.join(', ')}

VERIFIED CONTEXT (use it; never contradict it):
${contextDigest}

Return the basic outline JSON following the schema perfectly.`;
}