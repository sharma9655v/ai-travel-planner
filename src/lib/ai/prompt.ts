import { QuestionnaireData } from '@/types/questionnaire';

// Shared itinerary JSON schema — used by generation (buildSystemPrompt) and
// by the surgical editor (refinePrompt) so both stay in sync.
export const ITINERARY_SCHEMA = `{
  "tripSummary": {
    "destination": "string",
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD",
    "totalDays": 0,
    "totalBudgetEstimate": 0,
    "currency": "string",
    "travelStyle": "string",
    "highlights": ["string"],
    "coverDescription": "string",
    "bestTimeToVisit": "string (optional)"
  },
  "dailyItinerary": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "title": "string",
      "summary": "string",
      "activities": [
        {
          "time": "HH:MM",
          "endTime": "HH:MM",
          "name": "string",
          "description": "string",
          "location": "string",
          "latitude": 0,
          "longitude": 0,
          "duration": "string",
          "category": "sightseeing | food | transport | accommodation | adventure | shopping | relaxation | culture | nightlife | wellness",
          "estimatedCost": 0,
          "tips": "string",
          "rating": 0,
          "openingHours": "string (optional)",
          "distance": "string (optional)",
          "bestTimeToVisit": "string (optional)"
        }
      ],
      "totalCost": 0
    }
  ],
  "accommodations": [
    {
      "name": "string",
      "type": "string",
      "rating": 0,
      "pricePerNight": 0,
      "location": "string",
      "latitude": 0,
      "longitude": 0,
      "amenities": ["string"],
      "description": "string"
    }
  ],
  "restaurants": [
    {
      "name": "string",
      "cuisine": "string",
      "priceRange": "string",
      "rating": 0,
      "dietaryOptions": ["string"],
      "location": "string",
      "latitude": 0,
      "longitude": 0,
      "description": "string",
      "mustTry": ["string"]
    }
  ],
  "budgetBreakdown": {
    "totalEstimated": 0,
    "totalBudget": 0,
    "currency": "string",
    "categories": [
      {
        "category": "string",
        "estimated": 0,
        "percentage": 0
      }
    ],
    "savingsTips": ["string"]
  },
  "packingChecklist": [
    {
      "category": "string",
      "items": [
        {
          "item": "string",
          "packed": false,
          "essential": true
        }
      ]
    }
  ],
  "transportationDetails": [
    {
      "from": "string",
      "to": "string",
      "mode": "string",
      "duration": "string",
      "estimatedCost": 0,
      "notes": "string"
    }
  ],
  "emergencyContacts": [
    {
      "service": "string",
      "number": "string",
      "notes": "string"
    }
  ],
  "hiddenGems": [
    {
      "name": "string",
      "description": "string",
      "location": "string",
      "latitude": 0,
      "longitude": 0,
      "category": "string",
      "tip": "string"
    }
  ],
  "localCustoms": ["string"],
  "travelTips": ["string"],
  "importantNotes": ["string"]
}`;

export function buildSystemPrompt(): string {
  return `You are an expert travel planner AI. Generate a personalized travel itinerary as a single JSON object.

CRITICAL OUTPUT RULES:
- Respond with ONLY valid JSON. No markdown, no commentary, no code fences.
- Do NOT use \`\`\`json code fences or backticks around the JSON.
- Do NOT add explanations, headings, or text before or after the JSON object.
- JSON must be complete and well-formed: no trailing commas, no comments, no missing closing braces.
- Every string must be valid JSON (escaped quotes, no raw newlines inside strings).
- Do NOT truncate the itinerary. All planned days must be present.
- Keep the output CONCISE to fit within token limits:
  - 3-4 activities per day (not more)
  - 2 accommodations max
  - 3 restaurants max
  - 1-2 hidden gems max
  - Short descriptions (1-2 sentences each)
  - 3-5 packing categories with 2-3 items each
  - 3-5 travel tips max
- ALL numeric fields must be numbers (not strings). Use 0 for unknown costs.
- ALL coordinate fields (latitude, longitude) must be realistic numbers.

CONTENT POLICY:
- This is a planning assistant, NOT a booking platform. No booking links or affiliate links.
- Prioritize quality info: descriptions, ratings (1-5), opening hours, estimated duration.
- Keep cost figures as rounded approximations.

JSON SCHEMA (follow exactly):

${ITINERARY_SCHEMA}

ENSURE ALL PROPERTIES MATCH THE SCHEMA. Provide realistic locations and coordinates.`;
}

export function buildUserPrompt(data: QuestionnaireData): string {
  return `Please create a detailed itinerary for a trip to ${data.tripDetails.destination}.
Dates: ${data.tripDetails.departureDate} to ${data.tripDetails.returnDate}
Budget: ${data.budget.totalBudget} ${data.budget.currency}
Companions: ${data.travelers.groupSize} people (${data.travelers.tripType})
Travel Style: ${data.style.travelStyle}, Pace: ${data.style.travelPace}
Interests: ${data.interests.interests.join(', ')}

Provide a deeply personalized itinerary following the JSON schema perfectly.`;
}
