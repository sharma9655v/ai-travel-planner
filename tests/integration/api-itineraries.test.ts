import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { DELETE, GET } from '@/app/api/itineraries/[id]/route';

function itineraryRequest(id: string, method: 'GET' | 'DELETE') {
  return new NextRequest(`http://localhost:3000/api/itineraries/${id}`, { method });
}

function routeContext(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe('/api/itineraries/[id] (saved trips)', () => {
  it('GET returns 404 with the documented error shape for an unknown id', async () => {
    const response = await GET(itineraryRequest('abc123', 'GET'), routeContext('abc123'));
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body).toEqual({ error: 'Itinerary abc123 not found' });
  });

  it('GET 404s for traversal attempts and never resolves a path', async () => {
    expect((await GET(itineraryRequest('x', 'GET'), routeContext('../x'))).status).toBe(404);
    expect((await GET(itineraryRequest('x', 'GET'), routeContext('..%2Fetc%2Fpasswd'))).status).toBe(
      404
    );
  });

  it('DELETE returns 404 (nothing is stored server-side yet)', async () => {
    const response = await DELETE(itineraryRequest('abc123', 'DELETE'), routeContext('abc123'));
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'Itinerary abc123 not found' });
  });
});
