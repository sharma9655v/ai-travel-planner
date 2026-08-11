import { NextResponse } from 'next/server';
import { generateItinerary } from '@/lib/ai/provider';
import { createItineraryId } from '@/lib/utils';
import { clientIp, createSlidingWindowLimiter } from '@/lib/rateLimit';
import { ItineraryValidationError, validateQuestionnaire } from '@/lib/validation/schemas';
import { createLogger, isDev } from '@/lib/logger';
import type { GenerateItineraryResponse } from '@/types/api';

const log = createLogger('api.generate');

export const maxDuration = 120; // Allow up to 120s for AI generation

// Paid AI endpoint: cap generation at 5 requests per IP per minute.
const isLimited = createSlidingWindowLimiter(5, 60 * 1000);

const MAX_BODY_BYTES = 50_000;

export async function POST(req: Request) {
  try {
    if (isLimited(clientIp(req))) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again in a minute.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    if (Number(req.headers.get('content-length') ?? 0) > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'The request is too large.' }, { status: 413 });
    }

    const body = await req.json();

    if (JSON.stringify(body).length > MAX_BODY_BYTES) {
      return NextResponse.json(
        { error: 'The request is too large.' },
        { status: 400 }
      );
    }

    // Request contract: the questionnaire must be structurally valid before
    // it is sent to the model (also guards the prompt against junk input).
    let data: ReturnType<typeof validateQuestionnaire>;
    try {
      data = validateQuestionnaire(body);
    } catch (error) {
      if (error instanceof ItineraryValidationError) {
        log.warn('request_validation_error', { status: 400, message: error.message });
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      throw error;
    }

    // 1. Call AI Provider
    const generatedItinerary = await generateItinerary(data);

    // 2. Generate a short ID for the URL (same format the client generates)
    const shortId = createItineraryId();

    // The client persists the result in local storage (see hooks/useItineraries).
    return NextResponse.json<GenerateItineraryResponse>({
      id: shortId,
      message: 'Itinerary generated successfully',
      itinerary: generatedItinerary,
      createdAt: new Date().toISOString(),
    });

  } catch (error: unknown) {
    if (error instanceof ItineraryValidationError) {
      // Only AI output can reach this catch — the request was validated above.
      log.error('ai.validation_error', { status: 502, message: error.message });
      return NextResponse.json(
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
    // Development: surface the real cause (e.g. the NVIDIA status/body).
    // Production: keep the generic copy — details live in server logs.
    const clientMessage = isDev()
      ? `Generation failed: ${message}`
      : 'Generation failed. Please try again.';
    return NextResponse.json({ error: clientMessage }, { status: 500 });
  }
}
