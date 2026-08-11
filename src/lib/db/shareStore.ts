// Supabase-backed share store — drop-in replacement for the file store
// in src/lib/sharing/store.ts (identical signatures).
//
// When Supabase + SUPABASE_SERVICE_ROLE_KEY are configured, shared trips
// live in the public.shared_trips table (written with the service role,
// which bypasses RLS). Otherwise every call delegates to the file store
// (data/shares/), so sharing always works. Validation lives in the file
// store (validateShareInput etc.) and is reused here — both backends
// reject exactly the same requests.

import { getSupabaseServiceClient } from '@/lib/supabase/server';
import type { ShareCreateInput, ShareCreateResult, SharedTripRecord } from '@/lib/sharing/types';
import {
  createSecret,
  createSharedTrip as createSharedTripFile,
  getSharedTrip as getSharedTripFile,
  hashSecret,
  isPlausibleItinerary,
  isValidToken,
  REVOKE_BYTES,
  revokeSharedTrip as revokeSharedTripFile,
  TOKEN_BYTES,
  validateShareInput,
} from '@/lib/sharing/store';

interface SharedTripRow {
  token: string;
  trip_id: string;
  mode: SharedTripRecord['mode'];
  itinerary: unknown;
  revoke_hash: string;
  created_at: string;
  updated_at: string;
}

function toRecord(row: SharedTripRow): SharedTripRecord | null {
  if (!isPlausibleItinerary(row.itinerary)) return null;
  return {
    token: row.token,
    tripId: row.trip_id,
    mode: row.mode,
    itinerary: row.itinerary,
    revokeKeyHash: row.revoke_hash,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getSharedTrip(token: string): Promise<SharedTripRecord | null> {
  if (!isValidToken(token)) return null;
  const db = getSupabaseServiceClient();
  if (!db) return getSharedTripFile(token);

  const { data, error } = await db
    .from('shared_trips')
    .select('token, trip_id, mode, itinerary, revoke_hash, created_at, updated_at')
    .eq('token', token)
    .maybeSingle();

  if (error || !data) return null;
  return toRecord(data as unknown as SharedTripRow);
}

export async function createSharedTrip(
  input: ShareCreateInput
): Promise<ShareCreateResult | { error: string }> {
  const db = getSupabaseServiceClient();
  if (!db) return createSharedTripFile(input);

  const validation = validateShareInput(input);
  if (!validation.ok) return { error: validation.error ?? 'Invalid share request.' };
  const existingToken = validation.existingToken;

  if (existingToken) {
    // Re-publishing requires the revoke key so link holders cannot
    // overwrite content — identical rule to the file store.
    const current = await getSharedTrip(existingToken);
    if (!current) return { error: 'Shared link not found.' };
    if (current.revokeKeyHash !== hashSecret(input.revokeKey ?? '')) {
      return { error: 'Invalid revoke key.' };
    }

    const now = new Date().toISOString();
    const { error } = await db
      .from('shared_trips')
      .update({ mode: input.mode, itinerary: input.itinerary, updated_at: now })
      .eq('token', existingToken);

    if (error) return { error: 'Sharing is temporarily unavailable. Try again.' };
    return {
      token: existingToken,
      revokeKey: input.revokeKey as string,
      mode: input.mode,
      createdAt: current.createdAt,
      updatedAt: now,
    };
  }

  const token = createSecret(TOKEN_BYTES);
  const revokeKey = createSecret(REVOKE_BYTES);
  const now = new Date().toISOString();
  const { error } = await db.from('shared_trips').insert({
    token,
    trip_id: input.tripId,
    mode: input.mode,
    itinerary: input.itinerary,
    revoke_hash: hashSecret(revokeKey),
    created_at: now,
    updated_at: now,
  });

  if (error) return { error: 'Sharing is temporarily unavailable. Try again.' };
  return { token, revokeKey, mode: input.mode, createdAt: now, updatedAt: now };
}

export async function revokeSharedTrip(token: string, revokeKey: string): Promise<boolean> {
  const db = getSupabaseServiceClient();
  if (!db) return revokeSharedTripFile(token, revokeKey);

  if (!isValidToken(token) || typeof revokeKey !== 'string' || !revokeKey) return false;
  const current = await getSharedTrip(token);
  if (!current || current.revokeKeyHash !== hashSecret(revokeKey)) return false;

  const { error } = await db.from('shared_trips').delete().eq('token', token);
  return !error;
}
