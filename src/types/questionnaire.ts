// ============================================================
// Questionnaire Types — All form field types for the travel survey
// ============================================================

export type TripType = 'solo' | 'couple' | 'family' | 'friends' | 'business' | 'honeymoon';

export type TransportMode =
  | 'flight'
  | 'train'
  | 'bus'
  | 'metro'
  | 'taxi'
  | 'rental-car'
  | 'self-drive'
  | 'bike'
  | 'walking'
  | 'electric-vehicle'
  | 'mixed';

export type AccommodationType =
  | 'hotel'
  | 'hostel'
  | 'airbnb'
  | 'resort'
  | 'homestay'
  | 'camping';

export type AccommodationAmenity =
  | 'wifi'
  | 'parking'
  | 'pool'
  | 'gym'
  | 'pet-friendly'
  | 'wheelchair-accessible';

export type DietaryPreference =
  | 'vegetarian'
  | 'vegan'
  | 'jain'
  | 'halal'
  | 'kosher'
  | 'gluten-free'
  | 'dairy-free'
  | 'seafood'
  | 'no-restrictions';

export type Interest =
  | 'adventure'
  | 'mountains'
  | 'beaches'
  | 'hiking'
  | 'wildlife'
  | 'museums'
  | 'historical'
  | 'shopping'
  | 'nightlife'
  | 'cafes'
  | 'photography'
  | 'festivals'
  | 'local-culture'
  | 'hidden-gems'
  | 'luxury'
  | 'wellness'
  | 'cruises'
  | 'water-sports'
  | 'theme-parks';

export type TravelStyle = 'budget' | 'mid-range' | 'luxury';
export type TravelPace = 'relaxed' | 'balanced' | 'fast';

export interface TripDetails {
  startingLocation: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  flexibleDates: boolean;
}

export interface TravelersInfo {
  tripType: TripType;
  groupSize: number;
  children: number;
  seniors: number;
  pets: boolean;
}

export interface BudgetInfo {
  totalBudget: number;
  currency: string;
  accommodation: number;
  food: number;
  activities: number;
  shopping: number;
  emergency: number;
}

export interface TransportInfo {
  modes: TransportMode[];
}

export interface AccommodationInfo {
  types: AccommodationType[];
  starRating: number;
  amenities: AccommodationAmenity[];
}

export interface FoodInfo {
  dietaryPreferences: DietaryPreference[];
}

export interface InterestsInfo {
  interests: Interest[];
}

export interface StyleInfo {
  travelStyle: TravelStyle;
  travelPace: TravelPace;
}

export interface QuestionnaireData {
  tripDetails: TripDetails;
  travelers: TravelersInfo;
  budget: BudgetInfo;
  transport: TransportInfo;
  accommodation: AccommodationInfo;
  food: FoodInfo;
  interests: InterestsInfo;
  style: StyleInfo;
}

// Default values for initializing the form
export const defaultQuestionnaireData: QuestionnaireData = {
  tripDetails: {
    startingLocation: '',
    destination: '',
    departureDate: '',
    returnDate: '',
    flexibleDates: false,
  },
  travelers: {
    tripType: 'solo',
    groupSize: 1,
    children: 0,
    seniors: 0,
    pets: false,
  },
  budget: {
    totalBudget: 50000,
    currency: 'INR',
    accommodation: 40,
    food: 25,
    activities: 20,
    shopping: 10,
    emergency: 5,
  },
  transport: {
    modes: [],
  },
  accommodation: {
    types: [],
    starRating: 3,
    amenities: [],
  },
  food: {
    dietaryPreferences: [],
  },
  interests: {
    interests: [],
  },
  style: {
    travelStyle: 'mid-range',
    travelPace: 'balanced',
  },
};

// Returns a deep copy of the defaults so nested references are never shared
// between the store and any caller (e.g. the store's reset()).
export function createDefaultQuestionnaireData(): QuestionnaireData {
  return structuredClone(defaultQuestionnaireData);
}
