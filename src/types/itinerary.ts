// ============================================================
// Itinerary Types — AI-generated output structure
// ============================================================

import type { QuestionnaireData } from './questionnaire';

export interface TripSummary {
  destination: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  totalBudgetEstimate: number;
  currency: string;
  travelStyle: string;
  highlights: string[];
  coverDescription: string;
  bestTimeToVisit?: string;
}

export interface Activity {
  time: string;
  endTime: string;
  name: string;
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  duration: string;
  category: ActivityCategory;
  estimatedCost: number;
  tips: string;
  rating?: number;
  openingHours?: string;
  distance?: string;
  bestTimeToVisit?: string;
}

export type ActivityCategory =
  | 'sightseeing'
  | 'food'
  | 'transport'
  | 'accommodation'
  | 'adventure'
  | 'shopping'
  | 'relaxation'
  | 'culture'
  | 'nightlife'
  | 'wellness';

export interface DayPlan {
  day: number;
  date: string;
  title: string;
  summary: string;
  activities: Activity[];
  totalCost: number;
}

export interface WeatherDay {
  date: string;
  tempHigh: number;
  tempLow: number;
  condition: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  recommendation: string;
  precipitationProbability?: number;
}

export interface CurrentWeather {
  temperature: number;
  apparentTemperature?: number;
  condition: string;
  icon: string;
  windSpeed: number;
  humidity: number;
  precipitation: number;
  isDay: boolean;
}

export type WeatherAlertLevel = 'warning' | 'advisory';

export interface WeatherAlert {
  level: WeatherAlertLevel;
  title: string;
  detail: string;
}

export interface WeatherResponse {
  current: CurrentWeather;
  forecast: WeatherDay[];
  alerts: WeatherAlert[];
  updatedAt: string;
}

export interface Accommodation {
  name: string;
  type: string;
  rating: number;
  pricePerNight: number;
  location: string;
  latitude: number;
  longitude: number;
  amenities: string[];
  description: string;
}

export interface Restaurant {
  name: string;
  cuisine: string;
  priceRange: string;
  rating: number;
  dietaryOptions: string[];
  location: string;
  latitude: number;
  longitude: number;
  description: string;
  mustTry: string[];
}

export interface BudgetCategory {
  category: string;
  estimated: number;
  percentage: number;
}

export interface BudgetBreakdown {
  totalEstimated: number;
  totalBudget: number;
  currency: string;
  categories: BudgetCategory[];
  savingsTips: string[];
}

export interface PackingItem {
  item: string;
  packed: boolean;
  essential: boolean;
}

export interface PackingCategory {
  category: string;
  items: PackingItem[];
}

export interface TransportDetail {
  from: string;
  to: string;
  mode: string;
  duration: string;
  estimatedCost: number;
  notes: string;
}

export interface EmergencyContact {
  service: string;
  number: string;
  notes: string;
}

export interface HiddenGem {
  name: string;
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  category: string;
  tip: string;
}

export interface RoutePoint {
  latitude: number;
  longitude: number;
}

// Compact, source-backed route geometry. Raw provider responses are never
// persisted; each route is reduced to the points the map needs to render it.
export interface RoutePlan {
  kind: 'arrival' | 'daily';
  day?: number;
  distanceKm: number;
  durationMinutes: number;
  geometry: RoutePoint[];
}

export interface TravelItinerary {
  tripSummary: TripSummary;
  dailyItinerary: DayPlan[];
  weatherForecast?: WeatherDay[];
  routePlans?: RoutePlan[];
  accommodations: Accommodation[];
  restaurants: Restaurant[];
  budgetBreakdown: BudgetBreakdown;
  packingChecklist: PackingCategory[];
  transportationDetails: TransportDetail[];
  emergencyContacts: EmergencyContact[];
  hiddenGems: HiddenGem[];
  localCustoms: string[];
  travelTips: string[];
  importantNotes: string[];
}

export interface SavedItinerary {
  id: string;
  itinerary: TravelItinerary;
  questionnaireData: QuestionnaireData;
  createdAt: string;
  updatedAt?: string;
  favorite?: boolean;
}
