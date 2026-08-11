import { afterAll, describe, expect, it } from 'vitest';
import {
  createSecret,
  createSharedTrip,
  getSharedTrip,
  hashSecret,
  isPlausibleItinerary,
  isValidToken,
  revokeSharedTrip,
  validateShareInput,
} from '@/lib/sharing/store';
import { tokyoItinerary } from '../fixtures';

const createdTokens: string[] = [];
const createdKeys: string[] = [];

afterAll(async () => {
  for (let i = 0; i < createdTokens.length; i++) {
    await revokeSharedTrip(createdTokens[i], createdKeys[i]);
  }
});

describe('isValidToken', () => {
  it('accepts exactly 48 lowercase hex chars', () => {
    expect(isValidToken('a'.repeat(48))).toBe(true);
    expect(isValidToken('ab12cd34ef56'.repeat(4))).toBe(true);
  });

  it('rejects traversal, paths and malformed tokens', () => {
    expect(isValidToken('../../etc/passwd')).toBe(false);
    expect(isValidToken('../secret.json')).toBe(false);
    expect(isValidToken('a'.repeat(47))).toBe(false);
    expect(isValidToken('a'.repeat(49))).toBe(false);
    expect(isValidToken('A'.repeat(48))).toBe(false);
    expect(isValidToken('')).toBe(false);
  });
});

describe('hashSecret / createSecret', () => {
  it('hashes secrets deterministically', () => {
    const h1 = hashSecret('secret-key');
    const h2 = hashSecret('secret-key');
    expect(h1).toBe(h2);
    expect(h1).toMatch(/^[a-f0-9]{64}$/);
    expect(h1).not.toBe(hashSecret('other-key'));
  });

  it('creates unique hex secrets of the requested byte length', () => {
    expect(createSecret(24)).toMatch(/^[a-f0-9]{48}$/);
    expect(createSecret(24)).not.toBe(createSecret(24));
  });
});

describe('isPlausibleItinerary', () => {
  it('accepts a full itinerary and rejects non-itineraries', () => {
    expect(isPlausibleItinerary(tokyoItinerary)).toBe(true);
    expect(isPlausibleItinerary(null)).toBe(false);
    expect(isPlausibleItinerary({})).toBe(false);
    expect(
      isPlausibleItinerary({
        tripSummary: {},
        dailyItinerary: [],
        accommodations: [],
        restaurants: [],
        packingChecklist: [],
        emergencyContacts: [],
      })
    ).toBe(true);
    const broken = { ...tokyoItinerary } as Partial<typeof tokyoItinerary>;
    delete broken.restaurants;
    expect(isPlausibleItinerary(broken)).toBe(false);
  });
});

describe('validateShareInput', () => {
  it('accepts a valid create request', () => {
    const result = validateShareInput({ tripId: 'trip-1', mode: 'view', itinerary: tokyoItinerary });
    expect(result.ok).toBe(true);
    expect(result.existingToken).toBeNull();
  });

  it('rejects bad trip ids and modes', () => {
    expect(
      validateShareInput({ tripId: '', mode: 'view', itinerary: tokyoItinerary }).ok
    ).toBe(false);
    expect(
      validateShareInput({ tripId: 'x'.repeat(65), mode: 'view', itinerary: tokyoItinerary }).ok
    ).toBe(false);
    expect(
      validateShareInput({ tripId: 'trip-1', mode: 'write' as never, itinerary: tokyoItinerary }).ok
    ).toBe(false);
  });

  it('rejects implausible and oversized payloads', () => {
    expect(validateShareInput({ tripId: 'trip-1', mode: 'view', itinerary: {} as never }).ok).toBe(
      false
    );
    const huge = {
      ...tokyoItinerary,
      tripSummary: { ...tokyoItinerary.tripSummary, destination: 'x'.repeat(450_000) },
    };
    const result = validateShareInput({ tripId: 'trip-1', mode: 'view', itinerary: huge });
    expect(result.ok).toBe(false);
    expect(result.error).toContain('large');
  });

  it('requires a revoke key when re-publishing', () => {
    const token = 'a'.repeat(48);
    const missing = validateShareInput({
      tripId: 'trip-1',
      mode: 'view',
      itinerary: tokyoItinerary,
      token,
    });
    expect(missing.ok).toBe(false);
    expect(missing.error).toContain('revoke key');

    const withKey = validateShareInput({
      tripId: 'trip-1',
      mode: 'view',
      itinerary: tokyoItinerary,
      token,
      revokeKey: 'b'.repeat(48),
    });
    expect(withKey.ok).toBe(true);
    expect(withKey.existingToken).toBe(token);
  });

  it('ignores malformed tokens on create', () => {
    const result = validateShareInput({
      tripId: 'trip-1',
      mode: 'view',
      itinerary: tokyoItinerary,
      token: '../x',
    });
    expect(result.ok).toBe(true);
    expect(result.existingToken).toBeNull();
  });
});

describe('file share store roundtrip', () => {
  it('creates, reads, re-publishes and revokes a share', async () => {
    const created = await createSharedTrip({
      tripId: 'trip-rt',
      mode: 'view',
      itinerary: tokyoItinerary,
    });
    expect('error' in created).toBe(false);
    if ('error' in created) return;
    createdTokens.push(created.token);
    createdKeys.push(created.revokeKey);
    expect(created.token).toMatch(/^[a-f0-9]{48}$/);
    expect(created.revokeKey).toMatch(/^[a-f0-9]{48}$/);

    const record = await getSharedTrip(created.token);
    expect(record?.itinerary.tripSummary.destination).toBe('Tokyo');
    expect(record?.mode).toBe('view');

    const republished = await createSharedTrip({
      tripId: 'trip-rt',
      mode: 'edit',
      itinerary: tokyoItinerary,
      token: created.token,
      revokeKey: created.revokeKey,
    });
    expect('error' in republished).toBe(false);
    if ('error' in republished) return;
    expect(republished.token).toBe(created.token);
    expect(republished.mode).toBe('edit');

    const tampered = await createSharedTrip({
      tripId: 'trip-rt',
      mode: 'edit',
      itinerary: tokyoItinerary,
      token: created.token,
      revokeKey: 'f'.repeat(48),
    });
    expect('error' in tampered && tampered.error).toBe('Invalid revoke key.');

    expect(await revokeSharedTrip(created.token, 'f'.repeat(48))).toBe(false);
    expect(await getSharedTrip(created.token)).not.toBeNull();
    expect(await revokeSharedTrip(created.token, created.revokeKey)).toBe(true);
    expect(await getSharedTrip(created.token)).toBeNull();
  });

  it('never resolves traversal or malformed tokens', async () => {
    expect(await getSharedTrip('../secret')).toBeNull();
    expect(await getSharedTrip('a'.repeat(47))).toBeNull();
  });
});
