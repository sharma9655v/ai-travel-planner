import { NextResponse } from 'next/server';
import type { ApiError } from '@/types/api';

// GET /api/itineraries/[id] — Fetch a saved itinerary by shortId
// Itineraries are persisted in the browser's local storage (hooks/useItineraries).
// Unknown ids return 404; a future backend can serve saved plans from here.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return NextResponse.json<ApiError>(
    { error: `Itinerary ${id} not found` },
    { status: 404 }
  );
}

// DELETE /api/itineraries/[id] — Delete a saved itinerary
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return NextResponse.json<ApiError>(
    { error: `Itinerary ${id} not found` },
    { status: 404 }
  );
}