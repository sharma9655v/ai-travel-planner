import type { SavedItinerary } from '@/types/itinerary';

export const ITINERARIES_STORAGE_KEY = 'atp:itineraries:v1';

// Estimated safe budget under localStorage's ~5MB per-origin quota.
export const STORAGE_BUDGET_BYTES = 3_500_000;

export function estimatePlansSize(plans: Record<string, SavedItinerary>): number {
  try {
    return new Blob([JSON.stringify(plans)]).size;
  } catch {
    return JSON.stringify(plans).length;
  }
}

// Removes the oldest entries (by createdAt) until only `keepCount` remain,
// never removing the plan with `excludeId` (the one being saved).
export function pruneOldestPlans(
  plans: Record<string, SavedItinerary>,
  keepCount: number,
  excludeId?: string
): Record<string, SavedItinerary> {
  const candidates = Object.entries(plans).filter(([id]) => id !== excludeId);
  const toRemove = candidates
    .sort(([, a], [, b]) => a.createdAt.localeCompare(b.createdAt))
    .slice(0, Math.max(0, candidates.length - keepCount));

  const idsToRemove = new Set(toRemove.map(([id]) => id));
  return Object.fromEntries(
    Object.entries(plans).filter(([id]) => !idsToRemove.has(id))
  );
}

export function isQuotaError(error: unknown): boolean {
  return (
    typeof DOMException !== 'undefined' &&
    error instanceof DOMException &&
    (error.name === 'QuotaExceededError' ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      error.code === 22)
  );
}