import { createHash, randomBytes } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { TravelItinerary } from '@/types/itinerary';
import type { ShareCreateInput, ShareCreateResult, SharedTripRecord } from './types';

// Server-side share store.
//
// Trips are normally persisted in the creator's browser (localStorage), which
// strangers can never read — so the public payload of a shared trip lives here,
// one JSON file per token under <project>/data/shares/.
//
// This is a self-contained backend that works with zero configuration. If a
// real database (Supabase / MongoDB) is configured later, replace the functions
// in this module — the API routes and UI don't need to change.

export const TOKEN_BYTES = 24; // 48 hex chars
export const REVOKE_BYTES = 24; // 48 hex chars
export const MAX_SHARE_PAYLOAD_BYTES = 400_000; // matches the refine endpoint cap

const HEX_RE = /^[a-f0-9]{48}$/;

const SHARE_DIR = path.join(process.cwd(), 'data', 'shares');

function sharePath(token: string): string {
  return path.join(SHARE_DIR, `${token}.json`);
}

export function hashSecret(secret: string): string {
  return createHash('sha256').update(secret).digest('hex');
}

export function isValidToken(token: string): boolean {
  return HEX_RE.test(token);
}

export function createSecret(bytes: number): string {
  return randomBytes(bytes).toString('hex');
}

// Strict payload guard: reject anything that isn't shaped like a TravelItinerary.
export function isPlausibleItinerary(value: unknown): value is TravelItinerary {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.tripSummary === 'object' &&
    v.tripSummary !== null &&
    Array.isArray(v.dailyItinerary) &&
    Array.isArray(v.accommodations) &&
    Array.isArray(v.restaurants) &&
    Array.isArray(v.packingChecklist) &&
    Array.isArray(v.emergencyContacts)
  );
}

export interface ShareInputValidation {
  ok: boolean;
  error?: string;
  existingToken: string | null;
}

// Shared by the file store and the Supabase adapter so both backends
// reject exactly the same requests.
export function validateShareInput(input: ShareCreateInput): ShareInputValidation {
  if (!input.tripId || typeof input.tripId !== 'string' || input.tripId.length > 64) {
    return { ok: false, error: 'Invalid trip id.', existingToken: null };
  }
  if (input.mode !== 'view' && input.mode !== 'edit') {
    return { ok: false, error: 'Invalid share mode.', existingToken: null };
  }
  if (!isPlausibleItinerary(input.itinerary)) {
    return { ok: false, error: 'Invalid itinerary payload.', existingToken: null };
  }
  if (JSON.stringify(input.itinerary).length > MAX_SHARE_PAYLOAD_BYTES) {
    return { ok: false, error: 'Itinerary is too large to share.', existingToken: null };
  }
  const existingToken = input.token && isValidToken(input.token) ? input.token : null;
  if (existingToken && (!input.revokeKey || typeof input.revokeKey !== 'string')) {
    return { ok: false, error: 'A revoke key is required to update a shared link.', existingToken: null };
  }
  return { ok: true, existingToken };
}

export async function getSharedTrip(token: string) {
  if (!isValidToken(token)) return null;
  try {
    const raw = await readFile(sharePath(token), 'utf8');
    const record = JSON.parse(raw) as SharedTripRecord;
    if (!isPlausibleItinerary(record.itinerary)) return null;
    return record;
  } catch {
    return null;
  }
}

// Create a new share, or re-publish an existing one.
// Re-publishing requires the revoke key so link holders cannot overwrite content.
export async function createSharedTrip(input: ShareCreateInput): Promise<ShareCreateResult | { error: string }> {
  const validation = validateShareInput(input);
  if (!validation.ok) return { error: validation.error ?? 'Invalid share request.' };
  const existingToken = validation.existingToken;

  if (existingToken) {
    if (!input.revokeKey || typeof input.revokeKey !== 'string') {
      return { error: 'A revoke key is required to update a shared link.' };
    }
    const record = await getSharedTrip(existingToken);
    if (!record) return { error: 'Shared link not found.' };
    if (record.revokeKeyHash !== hashSecret(input.revokeKey)) {
      return { error: 'Invalid revoke key.' };
    }

    const now = new Date().toISOString();
    const updated: SharedTripRecord = { ...record, mode: input.mode, itinerary: input.itinerary, updatedAt: now };
    try {
      await mkdir(SHARE_DIR, { recursive: true });
      await writeFile(sharePath(existingToken), JSON.stringify(updated), 'utf8');
    } catch {
      return { error: 'Sharing is temporarily unavailable. Try again.' };
    }
    return {
      token: existingToken,
      revokeKey: input.revokeKey,
      mode: updated.mode,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  const token = createSecret(TOKEN_BYTES);
  const revokeKey = createSecret(REVOKE_BYTES);
  const now = new Date().toISOString();
  const record: SharedTripRecord = {
    token,
    tripId: input.tripId,
    mode: input.mode,
    itinerary: input.itinerary,
    revokeKeyHash: hashSecret(revokeKey),
    createdAt: now,
    updatedAt: now,
  };

  try {
    await mkdir(SHARE_DIR, { recursive: true });
    await writeFile(sharePath(token), JSON.stringify(record), 'utf8');
  } catch {
    return { error: 'Sharing is temporarily unavailable. Try again.' };
  }

  return { token, revokeKey, mode: record.mode, createdAt: now, updatedAt: now };
}

export async function revokeSharedTrip(token: string, revokeKey: string): Promise<boolean> {
  if (!isValidToken(token) || typeof revokeKey !== 'string' || !revokeKey) return false;
  const record = await getSharedTrip(token);
  if (!record) return false;
  if (record.revokeKeyHash !== hashSecret(revokeKey)) return false;
  try {
    await unlink(sharePath(token));
    return true;
  } catch {
    return false;
  }
}
