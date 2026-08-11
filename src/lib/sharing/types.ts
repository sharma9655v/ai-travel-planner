import type { TravelItinerary } from '@/types/itinerary';

export type ShareMode = 'view' | 'edit';

// Metadata persisted client-side (same localStorage store as trips).
export interface ShareLinkMeta {
  token: string;
  mode: ShareMode;
  revokeKey: string;
  createdAt: string;
  updatedAt: string;
}

// Payload stored server-side, keyed by unguessable token.
export interface SharedTripRecord {
  token: string;
  tripId: string;
  mode: ShareMode;
  itinerary: TravelItinerary;
  revokeKeyHash: string;
  createdAt: string;
  updatedAt: string;
}

// What a public GET reveals — never includes questionnaireData.
export interface PublicSharedTrip {
  itinerary: TravelItinerary;
  mode: ShareMode;
  createdAt: string;
}

export interface ShareCreateInput {
  tripId: string;
  itinerary: TravelItinerary;
  mode: ShareMode;
  token?: string;
  revokeKey?: string;
}

export interface ShareCreateResult {
  token: string;
  revokeKey: string;
  mode: ShareMode;
  createdAt: string;
  updatedAt: string;
}
