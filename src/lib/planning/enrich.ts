import type {
  Accommodation,
  Activity,
  Restaurant,
  RoutePlan,
  TravelItinerary,
  TripSummary,
  WeatherDay,
} from '@/types/itinerary';
import type { QuestionnaireData, StyleInfo } from '@/types/questionnaire';
import type { ValidatedBasicItinerary } from './basicSchema';
import type { EnrichmentInput, EnrichmentWeather, PlaceCandidate } from './types';

// ============================================================
// Deterministic enrichment assembly. Turns the fast basic plan +
// live provider data (weather, OSM places, hotels, restaurants,
// events, OSRM routes) into the full TravelItinerary. No invented
// facts: when a provider failed, the section degrades to an honest
// empty/placeholder state instead of fabricated data.
// ============================================================

const MAX_ACCOMMODATIONS = 2;
const MAX_RESTAURANTS = 3;
const MAX_EVENTS = 3;

interface DayInput {
  day: number;
  date: string;
  title: string;
  summary: string;
  activities: Array<{
    time: string;
    endTime: string;
    name: string;
    description: string;
    location: string;
    latitude: number;
    longitude: number;
    duration: string;
    category: Activity['category'];
    estimatedCost: number;
    tips: string;
  }>;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

function daysBetween(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate || startDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1;
  return clamp(Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1, 1, 60);
}

function isDateInRange(date: string, startDate: string, endDate: string): boolean {
  return date >= startDate && date <= (endDate || startDate);
}

function styleLabel(style: StyleInfo): string {
  const styleWord = style.travelStyle === 'budget' ? 'Budget' : style.travelStyle === 'luxury' ? 'Luxury' : 'Mid-range';
  const paceWord = style.travelPace === 'relaxed' ? 'relaxed pace' : style.travelPace === 'fast' ? 'fast pace' : 'balanced pace';
  return `${styleWord}, ${paceWord}`;
}

function weatherForDates(
  forecast: WeatherDay[] | undefined,
  startDate: string,
  endDate: string
): WeatherDay[] | undefined {
  if (!forecast || forecast.length === 0) return undefined;
  const filtered = forecast.filter((day) => isDateInRange(day.date, startDate, endDate));
  return filtered.length > 0 ? filtered : undefined;
}

function placeMatch(
  activities: DayInput['activities'],
  places: PlaceCandidate[]
): Map<string, PlaceCandidate> {
  const matched = new Map<string, PlaceCandidate>();
  const used = new Set<string>();

  for (const activity of activities) {
    const query = `${activity.name} ${activity.location}`.toLowerCase();
    const best = places.find(
      (place) =>
        !used.has(place.sourceId) &&
        (query.includes(place.name.toLowerCase()) ||
          place.name.toLowerCase().includes(activity.name.toLowerCase()))
    );
    if (best) {
      used.add(best.sourceId);
      matched.set(`${activity.name}|${activity.location}`, best);
    }
  }

  return matched;
}

function buildPacking(travelStyle: string, weather: EnrichmentWeather | null): TravelItinerary['packingChecklist'] {
  const essentials: string[] = ['Passport / ID', 'Travel insurance details', 'Phone charger + power bank'];
  const clothes: string[] = ['Versatile outfits', 'Comfortable walking shoes', 'Weather-ready layers'];

  if (weather) {
    const rain = weather.forecast.some((day) => (day.precipitationProbability ?? 0) >= 40);
    const cold = weather.forecast.some((day) => day.tempLow < 10);
    const hot = weather.forecast.some((day) => day.tempHigh > 28);
    if (rain) clothes.push('Compact umbrella / rain jacket');
    if (cold) clothes.push('Warm jacket and scarf');
    if (hot) clothes.push('Sun hat and sunscreen');
  }

  const tech: string[] = ['Adapter (if travelling abroad)', 'Camera or phone with good camera'];

  return [
    { category: 'Essentials', items: essentials.map((item) => ({ item, packed: false, essential: true })) },
    { category: 'Clothing', items: clothes.map((item) => ({ item, packed: false, essential: item.includes('shoes') })) },
    { category: 'Tech & Extras', items: tech.map((item) => ({ item, packed: false, essential: false })) },
  ];
}

function buildBudgetBreakdown(
  data: QuestionnaireData,
  totalDays: number
): TravelItinerary['budgetBreakdown'] {
  const raw = data.budget;
  const buckets = [
    { category: 'Accommodation', weight: raw.accommodation },
    { category: 'Food', weight: raw.food },
    { category: 'Activities', weight: raw.activities },
    { category: 'Shopping', weight: raw.shopping },
    { category: 'Emergency', weight: raw.emergency },
  ];
  const totalWeight = buckets.reduce((sum, b) => sum + b.weight, 0) || 1;
  const categories = buckets.map((b) => ({
    category: b.category,
    estimated: Math.round((raw.totalBudget * b.weight) / totalWeight),
    percentage: Math.round((b.weight / totalWeight) * 100),
  }));

  return {
    totalEstimated: raw.totalBudget,
    totalBudget: raw.totalBudget,
    currency: raw.currency,
    categories,
    savingsTips: [
      `About ${Math.max(1, totalDays)} day${totalDays > 1 ? 's' : ''} in ${data.tripDetails.destination} — book early for the best rates.`,
      'Compare flight/train options before booking your main transfer.',
    ],
  };
}

function buildTransportation(
  arrivalRoute: RoutePlan | null,
  destinationLabel: string
): TravelItinerary['transportationDetails'] {
  if (!arrivalRoute) return [];

  const duration = arrivalRoute.durationMinutes < 60
    ? `${arrivalRoute.durationMinutes} min`
    : `${Math.round(arrivalRoute.durationMinutes / 60)} h ${arrivalRoute.durationMinutes % 60} min`;

  return [
    {
      from: 'Arrival (airport or station)',
      to: destinationLabel,
      mode: 'road',
      duration,
      estimatedCost: 0,
      notes: `Live routing estimate: ${arrivalRoute.distanceKm} km by road.`,
    },
  ];
}

// ============================================================
// Main entry — deterministic assembly of the enriched itinerary.
// ============================================================

export function assembleItinerary(
  input: EnrichmentInput,
  basic: ValidatedBasicItinerary
): TravelItinerary {
  const { data, destination, weather, places, hotels, restaurants, events, arrivalRoute, dailyRoutes } = input;
  const destinationName = data.tripDetails.destination || destination?.label || 'Destination';
  const totalDays = daysBetween(data.tripDetails.departureDate, data.tripDetails.returnDate);
  const dayPlans: DayInput[] = basic.dailyItinerary.map((day) => ({
    day: day.day,
    date: day.date,
    title: day.title,
    summary: day.summary,
    activities: day.activities.map((a) => ({
      time: a.time,
      endTime: a.endTime,
      name: a.name,
      description: a.description,
      location: a.location,
      latitude: Number.isFinite(a.latitude) ? a.latitude : 0,
      longitude: Number.isFinite(a.longitude) ? a.longitude : 0,
      duration: a.duration,
      category: a.category,
      estimatedCost: a.estimatedCost,
      tips: a.tips ?? '',
    })),
  }));

  const matched = placeMatch(
    dayPlans.flatMap((d) => d.activities),
    places
  );
  const usedPlaces = new Set<string>();

  for (const day of dayPlans) {
    for (const activity of day.activities) {
      const best = matched.get(`${activity.name}|${activity.location}`) ?? matched.get(`${activity.name}|`);
      if (best) {
        activity.latitude = best.latitude;
        activity.longitude = best.longitude;
        activity.location = best.location || activity.location;
        usedPlaces.add(best.sourceId);
      }
    }
  }

  const unusedPlaces = places.filter((place) => !usedPlaces.has(place.sourceId));

  for (const event of events) {
    if (!isDateInRange(event.date, data.tripDetails.departureDate, data.tripDetails.returnDate)) continue;
    const day = dayPlans.find((d) => d.date === event.date);
    if (!day || day.activities.length >= 6) continue;

    const inserted = events.filter((e) => isDateInRange(e.date, data.tripDetails.departureDate, data.tripDetails.returnDate)).indexOf(event);
    if (inserted >= MAX_EVENTS) break;

    const latitude = Number.isFinite(event.latitude) && Math.abs(event.latitude) > 0.0001 ? event.latitude : (destination?.latitude ?? 0);
    const longitude = Number.isFinite(event.longitude) && Math.abs(event.longitude) > 0.0001 ? event.longitude : (destination?.longitude ?? 0);

    day.activities.push({
      time: event.time || '20:00',
      endTime: '22:00',
      name: event.name,
      description: `Live event on ${event.date}${event.time ? ` at ${event.time}` : ''}.`,
      location: event.label || destinationName,
      latitude,
      longitude,
      duration: '2 hours',
      category: event.category,
      estimatedCost: 0,
      tips: '',
    });
  }

  const summary: TripSummary = {
    destination: destinationName,
    startDate: data.tripDetails.departureDate,
    endDate: data.tripDetails.returnDate,
    totalDays,
    totalBudgetEstimate: data.budget.totalBudget,
    currency: data.budget.currency,
    travelStyle: styleLabel(data.style),
    highlights: basic.highlights.length > 0 ? basic.highlights.slice(0, 6) : [destinationName],
    coverDescription: basic.coverDescription || `A ${totalDays}-day journey through ${destinationName}.`,
  };

  const accommodationList: Accommodation[] = hotels.slice(0, MAX_ACCOMMODATIONS).map((hotel) => ({
    name: hotel.name,
    type: hotel.kind || 'hotel',
    rating: hotel.starRating || 0,
    pricePerNight: 0,
    location: hotel.location,
    latitude: hotel.latitude,
    longitude: hotel.longitude,
    amenities: hotel.amenities,
    description: `Verified stay in ${hotel.location || destinationName} — check rates on your booking platform.`,
  }));

  if (accommodationList.length === 0) {
    accommodationList.push({
      name: `Central stay options in ${destinationName}`,
      type: 'hotel',
      rating: 0,
      pricePerNight: 0,
      location: destinationName,
      latitude: destination?.latitude ?? 0,
      longitude: destination?.longitude ?? 0,
      amenities: [],
      description: 'Browse hotels in the destination — prices vary by season.',
    });
  }

  const restaurantList: Restaurant[] = restaurants.slice(0, MAX_RESTAURANTS).map((restaurant) => ({
    name: restaurant.name,
    cuisine: restaurant.cuisine,
    priceRange: restaurant.priceRange,
    rating: 0,
    dietaryOptions: restaurant.dietaryOptions,
    location: restaurant.location,
    latitude: restaurant.latitude,
    longitude: restaurant.longitude,
    description: `Local dining in ${restaurant.location || destinationName}.`,
    mustTry: [],
  }));

  if (restaurantList.length === 0) {
    restaurantList.push({
      name: `Best local dining in ${destinationName}`,
      cuisine: 'Local',
      priceRange: 'Not listed',
      rating: 0,
      dietaryOptions: [],
      location: destinationName,
      latitude: destination?.latitude ?? 0,
      longitude: destination?.longitude ?? 0,
      description: 'Ask locals or check reviews for the best nearby restaurants.',
      mustTry: [],
    });
  }

  const hiddenGems: TravelItinerary['hiddenGems'] = unusedPlaces.slice(0, 3).map((place) => ({
    name: place.name,
    description: place.kind !== 'place' ? `A ${place.kind} worth a visit near ${place.location}.` : `A lesser-known spot near ${place.location}.`,
    location: place.location,
    latitude: place.latitude,
    longitude: place.longitude,
    category: place.category,
    tip: 'Go early or on a weekday to avoid crowds.',
  }));

  const vehicleRoutes: RoutePlan[] = [];
  if (arrivalRoute) vehicleRoutes.push(arrivalRoute);
  for (const route of dailyRoutes) vehicleRoutes.push(route);

  return {
    tripSummary: summary,
    dailyItinerary: dayPlans.map((day) => ({
      day: day.day,
      date: day.date,
      title: day.title,
      summary: day.summary,
      activities: day.activities,
      totalCost: day.activities.reduce((sum, a) => sum + (Number.isFinite(a.estimatedCost) ? a.estimatedCost : 0), 0),
    })),
    weatherForecast: weatherForDates(weather?.forecast, data.tripDetails.departureDate, data.tripDetails.returnDate),
    routePlans: vehicleRoutes.length > 0 ? vehicleRoutes : undefined,
    accommodations: accommodationList,
    restaurants: restaurantList,
    budgetBreakdown: buildBudgetBreakdown(data, totalDays),
    packingChecklist: buildPacking(data.style.travelStyle, weather),
    transportationDetails: buildTransportation(arrivalRoute, destinationName),
    emergencyContacts: [
      { service: 'Police / Ambulance / Fire', number: '112', notes: 'Universal emergency number in most countries.' },
      { service: 'Your embassy', number: 'Look up locally', notes: 'Consular help for lost documents or emergencies.' },
    ],
    hiddenGems,
    localCustoms: basic.localCustoms,
    travelTips: basic.travelTips,
    importantNotes: basic.importantNotes,
  };
}