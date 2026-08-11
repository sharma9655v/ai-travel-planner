import { ITINERARY_SCHEMA } from './prompt';
import type { TravelItinerary } from '@/types/itinerary';

// ============================================================
// Surgical Itinerary Editor — prompt contract
// The model edits ONLY what the command implies and must return
// the COMPLETE itinerary so nothing is lost in transit.
// ============================================================

export function buildRefineSystemPrompt(): string {
  return `You are a surgical travel itinerary editor. A user asks you to modify ONE aspect of their existing itinerary.

RULES — FOLLOW STRICTLY:
1. Modify ONLY the parts of the itinerary that the command implies. Never rewrite sections that are not related to the command.
2. You MUST return the COMPLETE itinerary JSON — every section, every day, every activity — with unchanged sections copied VERBATIM from the input. Never return a partial itinerary.
3. Do not invent or add data unless the command requires it (e.g. "Add a museum" requires a new activity; "Reduce budget" only adjusts numbers).
4. "Remove X" means delete matching entries. "Replace Day N" means rebuild only that day's activities. "More nightlife" adds/swaps activities to nightlife category within existing days. "Family friendly" adjusts activities, descriptions and tips to be suitable for families.
5. Keep the destination, dates, totalDays, currency and structure identical unless the command explicitly changes them.
6. Preserve approximate cost styling: rounded, clearly-approximate figures — never precise-looking prices.
7. Respond with ONLY valid JSON in this exact shape:

{
  "summary": "one short sentence describing what you changed",
  "itinerary": ${ITINERARY_SCHEMA}
}

If the command does not require any change (e.g. a greeting or a general question), return the itinerary unchanged and set summary to a helpful conversational reply.

ENSURE ALL PROPERTIES EXACTLY MATCH THE SCHEMA. Do not omit any properties.`;
}

export function buildRefineUserPrompt(
  itinerary: TravelItinerary,
  command: string
): string {
  return `Here is the current itinerary as JSON:

${JSON.stringify(itinerary)}

User command: "${command}"

Apply ONLY the change implied by this command and return the complete updated itinerary following the rules above.`;
}
