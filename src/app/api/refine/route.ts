import { NextRequest, NextResponse } from 'next/server';
import { refineItinerary } from '@/lib/ai/refine';
import { clientIp, createSlidingWindowLimiter } from '@/lib/rateLimit';
import { ItineraryValidationError, itinerarySchema } from '@/lib/validation/schemas';
import { createLogger, isDev } from '@/lib/logger';
import type { TravelItinerary } from '@/types/itinerary';
import type { ApiError, RefineItineraryResponse } from '@/types/api';

const log = createLogger('api.refine');

export const maxDuration = 60;

// Paid AI endpoint: cap edits at 10 requests per IP per minute.
const isLimited = createSlidingWindowLimiter(10, 60 * 1000);

const MAX_COMMAND_LENGTH = 300;
const MAX_ITINERARY_BYTES = 400_000;

const MAX_REQUEST_BYTES = 450_000; // slightly above the itinerary cap + command

// Surgical itinerary editing: the client sends its current itinerary plus a
// natural-language command, and receives the complete updated itinerary back.
// Only the parts implied by the command are changed — everything else is
// preserved verbatim by the merge layer in src/lib/ai/refine.ts.
export async function POST(request: NextRequest) {
  try {
    if (isLimited(clientIp(request))) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again in a minute.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    if (Number(request.headers.get('content-length') ?? 0) > MAX_REQUEST_BYTES) {
      return NextResponse.json({ error: 'The request is too large.' }, { status: 413 });
    }

    const body = await request.json();

    const command = typeof body?.command === 'string' ? body.command.trim() : '';
    const itinerary = body?.itinerary as TravelItinerary | undefined;

    if (!command) {
      return NextResponse.json<ApiError>(
        { error: "Please tell me what you'd like to change (e.g. 'Replace Day 2')." },
        { status: 400 }
      );
    }

    if (command.length > MAX_COMMAND_LENGTH) {
      return NextResponse.json<ApiError>(
        { error: `Keep the request under ${MAX_COMMAND_LENGTH} characters.` },
        { status: 400 }
      );
    }

    if (!itinerary || typeof itinerary !== 'object' || Array.isArray(itinerary)) {
      return NextResponse.json<ApiError>(
        { error: 'No itinerary was provided.' },
        { status: 400 }
      );
    }

    if (!itinerary.tripSummary || !Array.isArray(itinerary.dailyItinerary)) {
      return NextResponse.json<ApiError>(
        { error: 'The itinerary is malformed.' },
        { status: 400 }
      );
    }

    // Full runtime contract check — the client can hold stale data that
    // predates validation or was corrupted in storage.
    const contract = itinerarySchema.safeParse(itinerary);
    if (!contract.success) {
      log.warn('request_validation_error', {
        status: 400,
        issueCount: contract.error.issues.length,
        firstIssue: contract.error.issues[0]
          ? {
              path: contract.error.issues[0].path.join('.'),
              message: contract.error.issues[0].message,
            }
          : undefined,
      });
      return NextResponse.json<ApiError>(
        { error: 'The itinerary is malformed.' },
        { status: 400 }
      );
    }

    if (JSON.stringify(itinerary).length > MAX_ITINERARY_BYTES) {
      return NextResponse.json<ApiError>(
        { error: 'The itinerary is too large to edit.' },
        { status: 400 }
      );
    }

    const result = await refineItinerary(itinerary, command);

    return NextResponse.json<RefineItineraryResponse>({
      itinerary: result.itinerary,
      summary: result.summary,
      changed: result.changed,
    });
  } catch (error) {
    if (error instanceof ItineraryValidationError) {
      log.error('ai.validation_error', { status: 502, message: error.message });
      return NextResponse.json<ApiError>(
        { error: error.message },
        { status: 502 }
      );
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    log.error('request_error', {
      status: 500,
      errorName: error instanceof Error ? error.name : 'UnknownError',
      message,
      stack: error instanceof Error ? error.stack : undefined,
    });
    // Development: surface the real cause. Production: generic copy only —
    // details live in server logs.
    const clientMessage = isDev()
      ? `Refine failed: ${message}`
      : "I couldn't update the itinerary. Please try again.";
    return NextResponse.json<ApiError>({ error: clientMessage }, { status: 500 });
  }
}
