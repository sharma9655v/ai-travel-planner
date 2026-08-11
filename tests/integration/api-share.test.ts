import { afterAll, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { DELETE, POST } from '@/app/api/share/route';
import { GET } from '@/app/api/share/[token]/route';
import { tokyoItinerary } from '../fixtures';

const created: { token: string; key: string }[] = [];

afterAll(async () => {
  const { revokeSharedTrip } = await import('@/lib/sharing/store');
  for (const { token, key } of created) {
    await revokeSharedTrip(token, key);
  }
});

function shareRequest(body: unknown) {
  return new NextRequest('http://localhost:3000/api/share', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

function publicGet(token: string) {
  return GET(new NextRequest('http://localhost:3000/api/share/x'), {
    params: Promise.resolve({ token }),
  });
}

describe('POST /api/share', () => {
  it('rejects invalid JSON and payloads', async () => {
    expect((await POST(shareRequest('not json'))).status).toBe(400);
    expect(
      (await POST(shareRequest({ tripId: 't1', mode: 'write', itinerary: tokyoItinerary }))).status
    ).toBe(400);
    expect((await POST(shareRequest({ tripId: 't1', mode: 'view', itinerary: {} }))).status).toBe(
      400
    );
  });

  it('creates a share and exposes only the public payload', async () => {
    const response = await POST(shareRequest({ tripId: 't1', mode: 'view', itinerary: tokyoItinerary }));
    expect(response.status).toBe(201);

    const body = await response.json();
    expect(body.token).toMatch(/^[a-f0-9]{48}$/);
    expect(body.revokeKey).toMatch(/^[a-f0-9]{48}$/);
    created.push({ token: body.token, key: body.revokeKey });

    const publicResponse = await publicGet(body.token);
    expect(publicResponse.status).toBe(200);
    const publicBody = await publicResponse.json();
    expect(publicBody.itinerary.tripSummary.destination).toBe('Tokyo');
    expect(publicBody.mode).toBe('view');
    expect(JSON.stringify(publicBody)).not.toContain('revoke');
  });

  it('returns 404 for invalid, traversal or missing tokens', async () => {
    expect((await publicGet('not-a-token')).status).toBe(404);
    expect((await publicGet('../etc/passwd')).status).toBe(404);
    expect((await publicGet('a'.repeat(48))).status).toBe(404);
  });

  it('re-publishes with the revoke key and rejects tampering', async () => {
    const response = await POST(shareRequest({ tripId: 't2', mode: 'view', itinerary: tokyoItinerary }));
    const first = await response.json();
    created.push({ token: first.token, key: first.revokeKey });

    const repub = await POST(
      shareRequest({
        tripId: 't2',
        mode: 'edit',
        itinerary: tokyoItinerary,
        token: first.token,
        revokeKey: first.revokeKey,
      })
    );
    expect(repub.status).toBe(201);
    const second = await repub.json();
    expect(second.token).toBe(first.token);
    expect(second.mode).toBe('edit');

    const tampered = await POST(
      shareRequest({
        tripId: 't2',
        mode: 'edit',
        itinerary: tokyoItinerary,
        token: first.token,
        revokeKey: 'f'.repeat(48),
      })
    );
    expect(tampered.status).toBe(400);
    expect((await tampered.json()).error).toBe('Invalid revoke key.');
  });

  it('revokes with the correct key only', async () => {
    const response = await POST(shareRequest({ tripId: 't3', mode: 'view', itinerary: tokyoItinerary }));
    const { token, revokeKey } = await response.json();
    created.push({ token, key: revokeKey });

    const wrong = await DELETE(
      new NextRequest(`http://localhost:3000/api/share?token=${token}&key=${'f'.repeat(48)}`)
    );
    expect(wrong.status).toBe(404);

    const right = await DELETE(
      new NextRequest(`http://localhost:3000/api/share?token=${token}&key=${revokeKey}`)
    );
    expect(right.status).toBe(200);

    expect((await publicGet(token)).status).toBe(404);
  });
});
