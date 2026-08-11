'use client';

import type { User } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { SavedItinerary } from '@/types/itinerary';

export type TripEventAction = 'generated' | 'viewed' | 'edited';

interface CloudSavedTripRow {
  id: string;
  user_id: string;
  itinerary: SavedItinerary['itinerary'];
  questionnaire: SavedItinerary['questionnaireData'];
  favorite: boolean;
  created_at: string;
  updated_at: string;
}

interface CloudTripHistoryRow {
  trip_id: string;
  action: TripEventAction;
  created_at: string;
}

export async function getSessionUser(): Promise<User | null> {
  const client = getSupabaseBrowserClient();
  if (!client) return null;
  const { data } = await client.auth.getUser();
  return data.user ?? null;
}

// Upsert a trip to the user's saved_trips. No-op when logged out.
export async function syncTripToCloud(plan: SavedItinerary): Promise<void> {
  const client = getSupabaseBrowserClient();
  if (!client) return;
  const user = await getSessionUser();
  if (!user) return;

  const { error } = await client.from('saved_trips').upsert(
    {
      id: plan.id,
      user_id: user.id,
      itinerary: plan.itinerary,
      questionnaire: plan.questionnaireData ?? null,
      favorite: false,
      created_at: plan.createdAt,
      updated_at: plan.updatedAt ?? new Date().toISOString(),
    },
    { onConflict: 'id,user_id' }
  );

  if (error) console.warn('[sync] save failed:', error.message);
}

export async function deleteTripFromCloud(id: string): Promise<void> {
  const client = getSupabaseBrowserClient();
  if (!client) return;
  const user = await getSessionUser();
  if (!user) return;

  const { error } = await client
    .from('saved_trips')
    .delete()
    .eq('user_id', user.id)
    .eq('id', id);

  if (error) console.warn('[sync] delete failed:', error.message);
}

export async function setTripFavorite(id: string, favorite: boolean): Promise<void> {
  const client = getSupabaseBrowserClient();
  if (!client) return;
  const user = await getSessionUser();
  if (!user) return;

  const { error } = await client
    .from('saved_trips')
    .update({ favorite, updated_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('id', id);

  if (error) console.warn('[sync] favorite update failed:', error.message);
}

export async function fetchCloudTrips(): Promise<SavedItinerary[]> {
  const client = getSupabaseBrowserClient();
  if (!client) return [];
  const user = await getSessionUser();
  if (!user) return [];

  const { data, error } = await client
    .from('saved_trips')
    .select('id, itinerary, questionnaire, favorite, created_at, updated_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('[sync] fetch failed:', error.message);
    return [];
  }

  return (data as unknown as CloudSavedTripRow[]).map((row) => ({
    id: row.id,
    itinerary: row.itinerary,
    questionnaireData: row.questionnaire,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    favorite: row.favorite,
  }));
}

// Trip history event — recorded only for signed-in users; silent otherwise.
export async function recordTripEvent(tripId: string, action: TripEventAction): Promise<void> {
  const client = getSupabaseBrowserClient();
  if (!client) return;
  const user = await getSessionUser();
  if (!user) return;

  const { error } = await client.from('trip_history').insert({
    user_id: user.id,
    trip_id: tripId,
    action,
  });

  if (error) console.warn('[sync] history record failed:', error.message);
}

export async function fetchTripHistory(): Promise<CloudTripHistoryRow[]> {
  const client = getSupabaseBrowserClient();
  if (!client) return [];
  const user = await getSessionUser();
  if (!user) return [];

  const { data, error } = await client
    .from('trip_history')
    .select('trip_id, action, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.warn('[sync] history fetch failed:', error.message);
    return [];
  }

  return (data as unknown as CloudTripHistoryRow[]) ?? [];
}
