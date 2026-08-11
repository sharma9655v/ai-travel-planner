// ============================================================
// Savings Suggestions — deterministic, data-grounded rules.
// Never live prices, never booking/affiliate advice.
// ============================================================

import type { TravelItinerary } from '@/types/itinerary';
import { roundEstimate, type NormalizedBudget } from './normalize';

export interface SavingsSuggestion {
  id: string;
  title: string;
  detail: string;
  range: { low: number; high: number } | null;
  tag: string;
}

export function buildSavingsSuggestions(
  itinerary: TravelItinerary,
  budget: NormalizedBudget
): SavingsSuggestion[] {
  const suggestions: SavingsSuggestion[] = [];
  const cat = (id: 'accommodation' | 'food' | 'transport' | 'activities') =>
    budget.categories.find((c) => c.id === id);

  const transport = cat('transport');
  const hasPrivateRides =
    (itinerary.transportationDetails ?? []).some((d) =>
      /taxi|uber|private|car/i.test(d?.mode || '')
    ) ?? false;
  if (transport?.hasData && hasPrivateRides) {
    suggestions.push({
      id: 'public-transit',
      title: 'Swap private rides for public transit',
      detail:
        'Your plan includes taxi or private-car legs. Metro, buses and trains usually cover the same route for a fraction of the cost.',
      range: { low: roundEstimate(transport.low * 0.2), high: roundEstimate(transport.high * 0.4) },
      tag: 'Transport',
    });
  }

  const stays = itinerary.accommodations ?? [];
  const allPremiumStays = stays.length >= 2 && stays.every((a) => (a?.rating ?? 0) >= 4.5);
  const accommodation = cat('accommodation');
  if (accommodation?.hasData && allPremiumStays) {
    suggestions.push({
      id: 'mix-stays',
      title: 'Mix in mid-range stays',
      detail:
        'Every night is at a highly-rated stay. Splitting the trip between one premium night and comfortable mid-range options trims the total noticeably.',
      range: {
        low: roundEstimate(accommodation.low * 0.15),
        high: roundEstimate(accommodation.high * 0.3),
      },
      tag: 'Accommodation',
    });
  }

  const priceyDining =
    (itinerary.restaurants ?? []).some((r) => /^\${3,4}$/.test(r?.priceRange || '')) ?? false;
  const food = cat('food');
  if (food?.hasData && priceyDining) {
    suggestions.push({
      id: 'local-food',
      title: 'Add street food & local markets',
      detail:
        'Several $$$+ restaurants are on the plan. Mixing in local street food and market stalls keeps the flavor high and the food budget low.',
      range: { low: roundEstimate(food.low * 0.15), high: roundEstimate(food.high * 0.3) },
      tag: 'Food',
    });
  }

  const hasPaidThrills =
    (itinerary.dailyItinerary ?? []).some((d) =>
      (d?.activities ?? []).some(
        (a) =>
          (Number(a?.estimatedCost) || 0) > 0 &&
          (a?.category === 'adventure' || a?.category === 'nightlife')
      )
    ) ?? false;
  const activities = cat('activities');
  if (activities?.hasData && hasPaidThrills) {
    suggestions.push({
      id: 'free-sights',
      title: 'Balance paid thrills with free sights',
      detail:
        'Adventure and nightlife are pricey categories. Parks, viewpoints and cultural districts on your route are free and often the best memories.',
      range: { low: roundEstimate(activities.low * 0.1), high: roundEstimate(activities.high * 0.25) },
      tag: 'Activities',
    });
  }

  const emergency = budget.categories.find((c) => c.id === 'emergency');
  if (emergency?.hasData) {
    suggestions.push({
      id: 'protect-buffer',
      title: 'Keep your emergency buffer intact',
      detail:
        'Your plan sets aside a contingency cushion. Treat optional splurges as separate decisions so surprises never force a budget crisis.',
      range: null,
      tag: 'Emergency',
    });
  }

  const aiTips = itinerary.budgetBreakdown?.savingsTips ?? [];
  aiTips
    .filter((tip): tip is string => typeof tip === 'string' && tip.trim().length > 0)
    .slice(0, 3)
    .forEach((tip, i) => {
      suggestions.push({
        id: `ai-tip-${i}`,
        title: tip.trim(),
        detail: 'Suggested while planning your trip.',
        range: null,
        tag: 'Planning tip',
      });
    });

  return suggestions;
}
