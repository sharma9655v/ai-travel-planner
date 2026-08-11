import type { RoutePlan } from '@/types/itinerary';
import type { BasicGenerationContext } from './types';

// Builds the compact, model-friendly context digest that the fast basic-itinerary
// call consumes. Only sourced, verified data is included — never raw provider payloads.
export function buildGenerationDigest(context: BasicGenerationContext): string {
  const lines: string[] = [];

  if (context.destination) {
    lines.push(
      `Destination coordinates: ${context.destination.latitude.toFixed(4)}, ${context.destination.longitude.toFixed(4)}${context.destination.label ? ` (${context.destination.label.slice(0, 160)})` : ''}`
    );
  }

  if (context.weather) {
    const dayLines = context.weather.forecast.slice(0, 8).map(
      (day) =>
        `- ${day.date}: ${day.condition}, high ${Math.round(day.tempHigh)}\u00B0C, low ${Math.round(day.tempLow)}\u00B0C${day.precipitationProbability === undefined ? '' : `, rain ${day.precipitationProbability}%`}`
    );
    lines.push(`Weather during the trip:\n${dayLines.join('\n')}`);
  }

  if (context.places.length > 0) {
    const placeLines = context.places.slice(0, 12).map(
      (place) =>
        `- ${place.name} (${place.category}) at ${place.latitude.toFixed(4)},${place.longitude.toFixed(4)}`
    );
    lines.push(`Real places nearby (prefer these when they fit the plan):\n${placeLines.join('\n')}`);
  }

  if (context.arrivalRoute) {
    lines.push(
      `Road route to the destination: about ${context.arrivalRoute.distanceKm} km, ${context.arrivalRoute.durationMinutes} minutes.`
    );
  }

  return lines.join('\n\n');
}

export function routeSummary(route: RoutePlan | null): string {
  if (!route) return '';
  return `~${route.distanceKm} km / ${route.durationMinutes} min`;
}