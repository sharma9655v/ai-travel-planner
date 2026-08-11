import { callNvidiaChat, getStrongModel, parseAIResponse } from './nvidia';
import { buildRefineSystemPrompt, buildRefineUserPrompt } from './refinePrompt';
import type { TravelItinerary } from '@/types/itinerary';
import { validateItinerary } from '@/lib/validation/schemas';
import { createLogger } from '@/lib/logger';

// Network + parse + zod details are logged by ai.nvidia / validation;
// this namespace logs per-run start/end/error with timing. The user's edit
// command is user content — only its length is ever logged.
const log = createLogger('ai.refine');

// ============================================================
// Surgical Itinerary Editor — reuse the existing AI endpoint to
// modify ONLY what the user asked, preserving everything else.
// ============================================================

export interface RefineResult {
  itinerary: TravelItinerary;
  summary: string;
  changed: boolean;
}

const TOP_LEVEL_KEYS: (keyof TravelItinerary)[] = [
  'tripSummary',
  'dailyItinerary',
  'accommodations',
  'restaurants',
  'budgetBreakdown',
  'packingChecklist',
  'transportationDetails',
  'emergencyContacts',
  'hiddenGems',
  'localCustoms',
  'travelTips',
  'importantNotes',
];

const ARRAY_KEYS: (keyof TravelItinerary)[] = [
  'dailyItinerary',
  'accommodations',
  'restaurants',
  'packingChecklist',
  'transportationDetails',
  'emergencyContacts',
  'hiddenGems',
  'localCustoms',
  'travelTips',
  'importantNotes',
];

export async function refineItinerary(
  itinerary: TravelItinerary,
  command: string
): Promise<RefineResult> {
  const startedAt = Date.now();
  log.info('ai.refine.start', { commandLength: command.length });

  try {
    const rawResponse = await callNvidiaChat(
      [
        { role: 'system', content: buildRefineSystemPrompt() },
        { role: 'user', content: buildRefineUserPrompt(itinerary, command) },
      ],
      { maxTokens: 8192, temperature: 0.7, topP: 0.9, seed: 7, model: getStrongModel(), jsonMode: true }
    );

    const parsed = parseAIResponse(rawResponse) as
      | { summary?: unknown; itinerary?: unknown }
      | Record<string, unknown>;

    // The editor responds { summary, itinerary }; tolerate a bare itinerary too.
    const wrapper =
      parsed && typeof parsed === 'object' && !Array.isArray(parsed) && 'itinerary' in parsed
        ? parsed
        : { summary: undefined, itinerary: parsed };

    const summary =
      typeof wrapper.summary === 'string' && wrapper.summary.trim().length > 0
        ? wrapper.summary.trim()
        : 'Your itinerary has been updated.';

    const candidate = (wrapper.itinerary ?? parsed) as Record<string, unknown>;

    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
      throw new Error('The AI response did not contain a valid itinerary.');
    }

    const merged = mergePreserving(itinerary, candidate);
    const changed = JSON.stringify(merged) !== JSON.stringify(itinerary);

    // The merged result must still satisfy the runtime contract — otherwise
    // the edit is rejected and the client keeps its previous itinerary.
    const validated = validateItinerary(merged);

    log.info('ai.refine.end', { durationMs: Date.now() - startedAt, changed });
    return { itinerary: validated, summary, changed };
  } catch (error) {
    log.error('ai.refine.error', {
      durationMs: Date.now() - startedAt,
      errorName: error instanceof Error ? error.name : 'UnknownError',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Preservation merge — guarantees the original itinerary can never shrink
 * silently: any top-level section the model omitted or malformed is restored
 * verbatim from the original, and dropped days are re-appended in order.
 */
export function mergePreserving(
  original: TravelItinerary,
  candidate: Record<string, unknown>
): TravelItinerary {
  const merged: Record<string, unknown> = {};

  for (const key of TOP_LEVEL_KEYS) {
    const next = candidate[key];
    if (next === undefined || next === null) {
      // Model dropped the section → restore the original verbatim.
      merged[key] = original[key];
      continue;
    }
    if (ARRAY_KEYS.includes(key) && !Array.isArray(next)) {
      merged[key] = original[key];
      continue;
    }
    if (key === 'tripSummary' && (typeof next !== 'object' || Array.isArray(next))) {
      merged[key] = original.tripSummary;
      continue;
    }
    if (key === 'budgetBreakdown' && (typeof next !== 'object' || Array.isArray(next))) {
      merged[key] = original.budgetBreakdown;
      continue;
    }
    merged[key] = next;
  }

  const result = merged as unknown as TravelItinerary;

  // Day preservation: every original day must survive. Restore any day the
  // model dropped, keyed by its `day` number, preserving original order.
  const candidateDays = Array.isArray(result.dailyItinerary) ? result.dailyItinerary : [];
  const byDay = new Map(candidateDays.map((d) => [String(d?.day), d]));
  for (const day of original.dailyItinerary) {
    if (day && !byDay.has(String(day.day))) {
      byDay.set(String(day.day), day);
    }
  }
  const ordered = original.dailyItinerary
    .map((d) => byDay.get(String(d.day)))
    .filter((d): d is TravelItinerary['dailyItinerary'][number] => Boolean(d));
  result.dailyItinerary = ordered;

  return result;
}
