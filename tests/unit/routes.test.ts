import { describe, expect, it, vi } from 'vitest';
import { findRoadRoute, shouldTryRoadRoute } from '@/lib/planning/routes';

// ============================================================
// Route tests — the critical-path guard: long-haul trips (sea crossings,
// intercontinental) must skip OSRM road routing entirely instead of burning
// the generation budget on a useless route query.
// ============================================================

describe('shouldTryRoadRoute', () => {
  it('permits regional distances (e.g. Delhi → Jaipur)', () => {
    const delhi = { latitude: 28.6139, longitude: 77.209, label: 'Delhi' };
    const jaipur = { latitude: 26.9124, longitude: 75.7873, label: 'Jaipur' };
    expect(shouldTryRoadRoute(delhi, jaipur)).toBe(true);
  });

  it('skips sea-crossing trips (e.g. Mumbai → Dubai)', () => {
    const mumbai = { latitude: 19.076, longitude: 72.8777, label: 'Mumbai' };
    const dubai = { latitude: 25.2048, longitude: 55.2708, label: 'Dubai' };
    expect(shouldTryRoadRoute(mumbai, dubai)).toBe(false);
  });

  it('skips identical points', () => {
    const point = { latitude: 19.076, longitude: 72.8777, label: 'Mumbai' };
    expect(shouldTryRoadRoute(point, point)).toBe(false);
  });
});

describe('findRoadRoute', () => {
  it('returns null without any upstream call for out-of-range trips', async () => {
    const fetchMock = vi.fn(async () => {
      throw new Error('fetch should not be called for long-haul trips');
    });
    vi.stubGlobal('fetch', fetchMock);

    const mumbai = { latitude: 19.076, longitude: 72.8777, label: 'Mumbai' };
    const dubai = { latitude: 25.2048, longitude: 55.2708, label: 'Dubai' };

    const result = await findRoadRoute(mumbai, dubai, 'arrival');
    expect(result).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});