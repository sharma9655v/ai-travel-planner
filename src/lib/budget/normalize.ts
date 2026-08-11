// ============================================================
// Budget Normalization — canonical 6-category budget model.
// Pure functions (no React). Estimated ranges only — never
// live, binding, or real-time prices.
// ============================================================

import type { TravelItinerary } from '@/types/itinerary';

export type BudgetCategoryId =
  | 'accommodation'
  | 'food'
  | 'transport'
  | 'activities'
  | 'shopping'
  | 'emergency';

export type CategorySource = 'ai' | 'derived' | 'none';

export interface CategoryEstimate {
  id: BudgetCategoryId;
  low: number;
  high: number;
  share: number; // percentage of the total midpoint (0-100)
  hasData: boolean;
  source: CategorySource;
}

export interface NormalizedBudget {
  currency: string;
  days: number;
  categories: CategoryEstimate[];
  total: { low: number; high: number };
  daily: { low: number; high: number };
}

export interface CategoryUnit {
  label: string;
  unit: 'day' | 'night' | 'trip';
}

export const CATEGORY_META: Record<BudgetCategoryId, CategoryUnit> = {
  accommodation: { label: 'Accommodation', unit: 'night' },
  food: { label: 'Food', unit: 'day' },
  transport: { label: 'Transport', unit: 'day' },
  activities: { label: 'Activities', unit: 'day' },
  shopping: { label: 'Shopping', unit: 'day' },
  emergency: { label: 'Emergency Buffer', unit: 'trip' },
};

export const CATEGORY_ORDER: BudgetCategoryId[] = [
  'accommodation',
  'food',
  'transport',
  'activities',
  'shopping',
  'emergency',
];

const CATEGORY_ALIASES: Record<BudgetCategoryId, string[]> = {
  accommodation: ['accommodation', 'hotel', 'stay', 'lodging', 'resort', 'hostel', 'room', 'apartment'],
  food: ['food', 'meal', 'dining', 'eat', 'restaurant', 'cuisine', 'groceries', 'drinks'],
  transport: ['transport', 'travel', 'flight', 'transit', 'commute', 'car', 'train', 'taxi', 'ferry'],
  activities: [
    'activity',
    'sightseeing',
    'attraction',
    'entertainment',
    'experience',
    'adventure',
    'nightlife',
    'wellness',
    'culture',
    'relaxation',
    'tour',
    'sports',
  ],
  shopping: ['shopping', 'souvenir', 'market', 'gift', 'boutique'],
  emergency: ['emergency', 'buffer', 'contingency', 'incidentals', 'misc', 'insurance', 'other', 'unforeseen', 'reserve'],
};

function matchCategory(label: string): BudgetCategoryId | null {
  const l = (label || '').toLowerCase().trim();
  if (!l) return null;
  for (const id of CATEGORY_ORDER) {
    if (CATEGORY_ALIASES[id].some((keyword) => l.includes(keyword))) return id;
  }
  return null;
}

export function roundEstimate(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return 0;
  if (n < 50) return Math.max(5, Math.round(n));
  if (n < 500) return Math.round(n / 10) * 10;
  if (n < 5000) return Math.round(n / 50) * 50;
  return Math.round(n / 100) * 100;
}

function ensureRange(low: number, high: number): { low: number; high: number } {
  if (low > 0 && high <= low) {
    const widened = roundEstimate(low * 1.25);
    high = widened > low ? widened : low + (low < 100 ? 10 : 50);
  }
  return { low, high };
}

function expandAiEstimate(estimate: number): { low: number; high: number } {
  const low = roundEstimate(estimate * 0.8);
  const high = roundEstimate(estimate * 1.2);
  return ensureRange(low, high);
}

function deriveAccommodation(itinerary: TravelItinerary, days: number): { low: number; high: number } | null {
  const prices = (itinerary.accommodations ?? [])
    .map((a) => Number(a?.pricePerNight) || 0)
    .filter((p) => p > 0);
  if (prices.length === 0) return null;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return ensureRange(roundEstimate(min * days), roundEstimate(max * days));
}

function deriveTransport(itinerary: TravelItinerary): { low: number; high: number } | null {
  const costs = (itinerary.transportationDetails ?? [])
    .map((d) => Number(d?.estimatedCost) || 0)
    .filter((c) => c > 0);
  if (costs.length === 0) return null;
  const sum = costs.reduce((acc, c) => acc + c, 0);
  return ensureRange(roundEstimate(sum * 0.8), roundEstimate(sum * 1.2));
}

function deriveActivities(itinerary: TravelItinerary): { low: number; high: number } | null {
  const totals = (itinerary.dailyItinerary ?? [])
    .map((d) => Number(d?.totalCost) || 0)
    .filter((c) => c > 0);
  if (totals.length === 0) return null;
  const sum = totals.reduce((acc, c) => acc + c, 0);
  return ensureRange(roundEstimate(sum * 0.8), roundEstimate(sum * 1.2));
}

export function normalizeBudget(itinerary: TravelItinerary): NormalizedBudget {
  const days = Math.max(
    1,
    itinerary.tripSummary?.totalDays || itinerary.dailyItinerary?.length || 1
  );
  const currency = itinerary.tripSummary?.currency || 'INR';

  // 1. Roll AI-generated category estimates into the canonical six.
  const aiTotals = new Map<BudgetCategoryId, number>();
  for (const cat of itinerary.budgetBreakdown?.categories ?? []) {
    if (typeof cat?.estimated !== 'number' || cat.estimated <= 0) continue;
    const id = matchCategory(cat.category);
    if (id) aiTotals.set(id, (aiTotals.get(id) || 0) + cat.estimated);
  }

  // 2. Fill missing categories from the user's own plan data.
  const ranges: Record<BudgetCategoryId, { low: number; high: number }> = {
    accommodation: aiTotals.has('accommodation')
      ? expandAiEstimate(aiTotals.get('accommodation') as number)
      : deriveAccommodation(itinerary, days) ?? { low: 0, high: 0 },
    food: aiTotals.has('food') ? expandAiEstimate(aiTotals.get('food') as number) : { low: 0, high: 0 },
    transport: aiTotals.has('transport')
      ? expandAiEstimate(aiTotals.get('transport') as number)
      : deriveTransport(itinerary) ?? { low: 0, high: 0 },
    activities: aiTotals.has('activities')
      ? expandAiEstimate(aiTotals.get('activities') as number)
      : deriveActivities(itinerary) ?? { low: 0, high: 0 },
    shopping: aiTotals.has('shopping')
      ? expandAiEstimate(aiTotals.get('shopping') as number)
      : { low: 0, high: 0 },
    emergency: aiTotals.has('emergency')
      ? expandAiEstimate(aiTotals.get('emergency') as number)
      : { low: 0, high: 0 },
  };

  const sources: Record<BudgetCategoryId, CategorySource> = {
    accommodation: aiTotals.has('accommodation') ? 'ai' : ranges.accommodation.low > 0 ? 'derived' : 'none',
    food: aiTotals.has('food') ? 'ai' : 'none',
    transport: aiTotals.has('transport') ? 'ai' : ranges.transport.low > 0 ? 'derived' : 'none',
    activities: aiTotals.has('activities') ? 'ai' : ranges.activities.low > 0 ? 'derived' : 'none',
    shopping: aiTotals.has('shopping') ? 'ai' : 'none',
    emergency: aiTotals.has('emergency') ? 'ai' : 'none',
  };

  // 3. Standard planning buffer: if the AI gave no emergency figure, derive a
  //    8-12% contingency from the total of everything else.
  if (!aiTotals.has('emergency')) {
    const midOfOthers = CATEGORY_ORDER.filter((id) => id !== 'emergency')
      .filter((id) => ranges[id].low > 0)
      .reduce((acc, id) => acc + (ranges[id].low + ranges[id].high) / 2, 0);
    if (midOfOthers > 0) {
      ranges.emergency = {
        low: roundEstimate(midOfOthers * 0.08),
        high: roundEstimate(midOfOthers * 0.12),
      };
      sources.emergency = 'derived';
    }
  }

  // 4. Shares and totals.
  const categories: CategoryEstimate[] = CATEGORY_ORDER.map((id) => {
    const { low, high } = ranges[id];
    const hasData = low > 0 || high > 0;
    return {
      id,
      low,
      high,
      share: 0,
      hasData,
      source: sources[id],
    };
  });

  const totalMid = categories.filter((c) => c.hasData).reduce((acc, c) => acc + (c.low + c.high) / 2, 0);
  for (const category of categories) {
    if (!category.hasData || totalMid <= 0) continue;
    category.share = Math.round(((category.low + category.high) / 2 / totalMid) * 1000) / 10;
  }

  const total = {
    low: roundEstimate(categories.reduce((acc, c) => acc + c.low, 0)),
    high: roundEstimate(categories.reduce((acc, c) => acc + c.high, 0)),
  };
  const daily = {
    low: roundEstimate(total.low / days),
    high: roundEstimate(total.high / days),
  };

  return { currency, days, categories, total, daily };
}
