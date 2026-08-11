import { NextResponse } from 'next/server';
import { getSharedTrip } from '@/lib/db/shareStore';
import type { PublicSharedTrip } from '@/lib/sharing/types';

// GET /api/share/[token] — public read of a shared trip.
// Reveals only the itinerary + mode + createdAt — never questionnaireData,
// which may contain personal details.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const record = await getSharedTrip(token);
  if (!record) {
    return NextResponse.json({ error: 'This link is invalid or has been revoked.' }, { status: 404 });
  }

  const payload: PublicSharedTrip = {
    itinerary: record.itinerary,
    mode: record.mode,
    createdAt: record.createdAt,
  };

  return NextResponse.json(payload, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
