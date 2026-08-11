import type {
  ActivityCategory,
  RoutePlan,
  WeatherAlert,
  WeatherDay,
  WeatherResponse,
} from '@/types/itinerary';
import type { QuestionnaireData } from '@/types/questionnaire';

/** Forecast slice the assembly stage consumes (current conditions not needed). */
export interface EnrichmentWeather {
  forecast: WeatherDay[];
  alerts: WeatherAlert[];
}

export interface GeoPoint {
  latitude: number;
  longitude: number;
  label: string;
}

export interface PlaceCandidate extends GeoPoint {
  sourceId: string;
  name: string;
  location: string;
  category: ActivityCategory;
  kind: string;
}

export interface HotelCandidate extends PlaceCandidate {
  amenities: string[];
  starRating: number;
}

export interface RestaurantCandidate extends PlaceCandidate {
  cuisine: string;
  priceRange: string;
  dietaryOptions: string[];
}

export interface EventCandidate extends GeoPoint {
  sourceId: string;
  name: string;
  date: string;
  time?: string;
  category: ActivityCategory;
}

export interface BasicActivity {
  time: string;
  endTime: string;
  placeId?: string;
  name: string;
  description: string;
  location: string;
  duration: string;
  category: ActivityCategory;
  estimatedCost: number;
  tips: string;
}

export interface BasicDayPlan {
  day: number;
  date: string;
  title: string;
  summary: string;
  activities: BasicActivity[];
}

export interface BasicItinerary {
  highlights: string[];
  coverDescription: string;
  dailyItinerary: BasicDayPlan[];
  localCustoms: string[];
  travelTips: string[];
  importantNotes: string[];
}

export interface BasicGenerationContext {
  destination: GeoPoint | null;
  weather: WeatherResponse | null;
  places: PlaceCandidate[];
  arrivalRoute: RoutePlan | null;
}

export interface EnrichmentInput {
  data: QuestionnaireData;
  destination: GeoPoint | null;
  weather: EnrichmentWeather | null;
  places: PlaceCandidate[];
  hotels: HotelCandidate[];
  restaurants: RestaurantCandidate[];
  events: EventCandidate[];
  arrivalRoute: RoutePlan | null;
  dailyRoutes: RoutePlan[];
}
