// ============================================================
// API Contract Types — Shared by route handlers and their clients
// ============================================================

import type { TravelItinerary } from './itinerary';
import type { QuestionnaireData } from './questionnaire';

export interface GenerateItineraryResponse {
  id: string;
  message: string;
  itinerary: TravelItinerary;
  createdAt: string;
}

export interface ServerItineraryResponse {
  id: string;
  itinerary: TravelItinerary;
  questionnaireData: QuestionnaireData;
  createdAt: string;
}

export interface RefineItineraryResponse {
  itinerary: TravelItinerary;
  summary: string;
  changed: boolean;
}

export interface ApiError {
  error: string;
}