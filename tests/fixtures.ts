import type { GenerateItineraryResponse } from '../src/types/api';
import type { SavedItinerary, TravelItinerary, WeatherResponse } from '../src/types/itinerary';

export const ITINERARIES_STORAGE_KEY = 'atp:itineraries:v1';

// A complete, plausible itinerary (Tokyo, 7 days) used as the shared fixture
// across unit, integration and E2E tests. First activity carries real
// coordinates so the weather anchor resolves.
export const tokyoItinerary: TravelItinerary = {
  tripSummary: {
    destination: 'Tokyo',
    startDate: '2026-10-01',
    endDate: '2026-10-07',
    totalDays: 7,
    totalBudgetEstimate: 250000,
    currency: 'JPY',
    travelStyle: 'Balanced',
    highlights: ['Shibuya Crossing', 'Tokyo Skytree'],
    coverDescription: 'A 7-day Tokyo adventure.',
    bestTimeToVisit: 'October',
  },
  dailyItinerary: [
    {
      day: 1,
      date: '2026-10-01',
      title: 'Arrival & Shibuya',
      summary: 'Land, check in, and explore Shibuya at night.',
      activities: [
        {
          time: '16:00',
          endTime: '18:00',
          name: 'Shibuya Crossing',
          description: 'Watch the famous scramble crossing.',
          location: 'Shibuya',
          latitude: 35.6595,
          longitude: 139.7005,
          duration: '2 hours',
          category: 'sightseeing',
          estimatedCost: 0,
          tips: 'Go at sunset for the neon lights.',
          rating: 4.8,
          openingHours: '24 hours',
        },
      ],
      totalCost: 0,
    },
    {
      day: 2,
      date: '2026-10-02',
      title: 'Asakusa & Sky Tree',
      summary: 'Temples in the morning, tower views in the afternoon.',
      activities: [
        {
          time: '09:00',
          endTime: '11:00',
          name: 'Senso-ji Temple',
          description: 'Tokyo\u2019s oldest temple.',
          location: 'Asakusa',
          latitude: 35.7148,
          longitude: 139.7967,
          duration: '2 hours',
          category: 'culture',
          estimatedCost: 0,
          tips: 'Go early to avoid crowds.',
        },
        {
          time: '14:00',
          endTime: '16:00',
          name: 'Tokyo Skytree',
          description: 'Observation decks with a full city view.',
          location: 'Sumida',
          latitude: 35.7101,
          longitude: 139.8107,
          duration: '2 hours',
          category: 'sightseeing',
          estimatedCost: 3000,
          tips: 'Book the evening slot for sunset views.',
        },
      ],
      totalCost: 3000,
    },
  ],
  accommodations: [
    {
      name: 'Shinjuku Grand Hotel',
      type: 'hotel',
      rating: 4.2,
      pricePerNight: 18000,
      location: 'Shinjuku',
      latitude: 35.6938,
      longitude: 139.7034,
      amenities: ['WiFi', 'Breakfast'],
      description: 'Central hotel a short walk from the station.',
    },
  ],
  restaurants: [
    {
      name: 'Ichiran Shinjuku',
      cuisine: 'Ramen',
      priceRange: '$$',
      rating: 4.5,
      dietaryOptions: [],
      location: 'Shinjuku',
      latitude: 35.694,
      longitude: 139.701,
      description: 'Famous solo-dining ramen chain.',
      mustTry: ['Tonkotsu ramen'],
    },
  ],
  budgetBreakdown: {
    totalEstimated: 250000,
    totalBudget: 300000,
    currency: 'JPY',
    categories: [{ category: 'food', estimated: 50000, percentage: 20 }],
    savingsTips: ['Book trains in advance'],
  },
  packingChecklist: [
    {
      category: 'Essentials',
      items: [{ item: 'Passport', packed: false, essential: true }],
    },
  ],
  transportationDetails: [
    {
      from: 'Narita Airport',
      to: 'Shinjuku',
      mode: 'train',
      duration: '90 min',
      estimatedCost: 3000,
      notes: 'Narita Express, reserve a seat.',
    },
  ],
  emergencyContacts: [
    { service: 'Police', number: '110', notes: 'Emergency' },
  ],
  hiddenGems: [
    {
      name: 'Omoide Yokocho',
      description: 'Tiny alley of smoky yakitori bars.',
      location: 'Shinjuku',
      latitude: 35.6934,
      longitude: 139.7,
      category: 'food',
      tip: 'Go before 7pm to beat the queue.',
    },
  ],
  localCustoms: ['Bow when greeting'],
  travelTips: ['Get a Suica card at the airport'],
  importantNotes: ['Tipping is not customary'],
};

// What the refined copy of day 2 looks like after an AI edit.
export const refinedItinerary: TravelItinerary = {
  ...tokyoItinerary,
  dailyItinerary: [
    tokyoItinerary.dailyItinerary[0],
    {
      ...tokyoItinerary.dailyItinerary[1],
      title: 'Museum Day',
      summary: 'The National Museum and nearby gardens.',
      activities: [
        {
          time: '10:00',
          endTime: '13:00',
          name: 'Tokyo National Museum',
          description: 'World-class Japanese art and history.',
          location: 'Ueno',
          latitude: 35.7188,
          longitude: 139.7765,
          duration: '3 hours',
          category: 'culture',
          estimatedCost: 1000,
          tips: 'Arrive before opening to skip the queue.',
        },
      ],
      totalCost: 1000,
    },
  ],
};

export const weatherResponse: WeatherResponse = {
  current: {
    temperature: 24,
    apparentTemperature: 23,
    condition: 'Clear',
    icon: '01d',
    windSpeed: 4,
    humidity: 55,
    precipitation: 0,
    isDay: true,
  },
  forecast: [
    {
      date: '2026-10-01',
      tempHigh: 24,
      tempLow: 16,
      condition: 'Clear',
      icon: '01d',
      humidity: 55,
      windSpeed: 4,
      recommendation: 'Great conditions for sightseeing — enjoy the day.',
      precipitationProbability: 10,
    },
    {
      date: '2026-10-02',
      tempHigh: 22,
      tempLow: 15,
      condition: 'Clouds',
      icon: '03d',
      humidity: 60,
      windSpeed: 5,
      recommendation: 'Some rain possible — a compact umbrella is a good call.',
      precipitationProbability: 40,
    },
  ],
  alerts: [
    {
      level: 'advisory',
      title: 'Heat advisory',
      detail: 'Temperatures up to 36°C — plan hydration and indoor breaks.',
    },
  ],
  updatedAt: '2026-10-01T00:00:00.000Z',
};

export const generateResponse: GenerateItineraryResponse = {
  id: 'e2e-wizard',
  message: 'Itinerary generated successfully',
  itinerary: tokyoItinerary,
  createdAt: '2026-10-01T00:00:00.000Z',
};

// Minimal-but-typed questionnaire data: itinerary pages only read
// tripDetails.destination from it.
export function makeSavedItinerary(
  id: string,
  itinerary: TravelItinerary = tokyoItinerary
): SavedItinerary {
  return {
    id,
    itinerary,
    questionnaireData: {
      tripDetails: {
        startingLocation: 'Mumbai',
        destination: 'Tokyo',
        departureDate: '2026-10-01',
        returnDate: '2026-10-07',
        flexibleDates: false,
      },
    } as SavedItinerary['questionnaireData'],
    createdAt: '2026-10-01T00:00:00.000Z',
  };
}
