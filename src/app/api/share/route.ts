import { NextResponse } from 'next/server';
import { createSharedTrip, revokeSharedTrip } from '@/lib/db/shareStore';
import { clientIp, createSlidingWindowLimiter } from '@/lib/rateLimit';
import type { ShareCreateInput } from '@/lib/sharing/types';

// In-memory rate limit: 30 share creations per IP per rolling hour.
const rateLimited = createSlidingWindowLimiter(30, 60 * 60 * 1000);

// Route handlers have no default body limit — reject oversized payloads by
// Content-Length before the JSON parse allocates anything.
const MAX_SHARE_REQUEST_BYTES = 500_000;

// POST /api/share — create a new shared link, or re-publish an existing one.
export async function POST(request: Request) {
  // Rate limit BEFORE parsing: the body may be arbitrarily large and parsing
  // it first would let a caller burn memory on every attempt.
  if (rateLimited(clientIp(request))) {
    return NextResponse.json({ error: 'Too many share links created from this address. Try again later.' }, { status: 429 });
  }

  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > MAX_SHARE_REQUEST_BYTES) {
    return NextResponse.json({ error: 'The request is too large.' }, { status: 413 });
  }

  let body: ShareCreateInput;
  try {
    body = (await request.json()) as ShareCreateInput;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const result = await createSharedTrip(body);
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result, { status: 201 });
}

// DELETE /api/share — revoke a link. Requires the revoke key (never sent to
// link viewers), so only the creator can take a link down.
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token') ?? '';
  const revokeKey = searchParams.get('key') ?? '';

  const revoked = await revokeSharedTrip(token, revokeKey);
  if (!revoked) {
    return NextResponse.json({ error: 'Link not found or invalid revoke key.' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
