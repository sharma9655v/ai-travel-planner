import type { TravelItinerary } from '@/types/itinerary';
import type { PublicSharedTrip, ShareCreateResult, ShareMode, ShareLinkMeta } from './types';

export const SHARE_LINK_PREFIX = '/share/';

function shareUrl(token: string): string {
  return `${window.location.origin}${SHARE_LINK_PREFIX}${token}`;
}

async function parseJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? 'Something went wrong.');
  }
  return data;
}

// Create a new link or re-publish an existing one (same token + revoke key).
export async function publishShare(
  tripId: string,
  itinerary: TravelItinerary,
  mode: ShareMode,
  existing?: ShareLinkMeta | null
): Promise<ShareLinkMeta> {
  const response = await fetch('/api/share', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tripId,
      itinerary,
      mode,
      token: existing?.token,
      revokeKey: existing?.revokeKey,
    }),
  });

  const result = await parseJson<ShareCreateResult>(response);
  return {
    token: result.token,
    mode: result.mode,
    revokeKey: result.revokeKey,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
  };
}

export async function fetchSharedTrip(token: string): Promise<PublicSharedTrip> {
  const response = await fetch(`/api/share/${token}`, { cache: 'no-store' });
  return parseJson<PublicSharedTrip>(response);
}

export async function revokeShare(token: string, revokeKey: string): Promise<void> {
  const response = await fetch(`/api/share?token=${encodeURIComponent(token)}&key=${encodeURIComponent(revokeKey)}`, {
    method: 'DELETE',
  });
  await parseJson<{ ok: boolean }>(response);
}

export { shareUrl };
