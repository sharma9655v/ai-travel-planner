import { NextResponse } from 'next/server';
import { enrichItinerary } from '@/lib/ai/enrich';
import { clientIp, createSlidingWindowLimiter } from '@/lib/rateLimit';
import { ItineraryValidationError, itinerarySchema, questionnaireSchema } from '@/lib/validation/schemas';
import { createLogger, isDev } from '@/lib/logger';
import type { QuestionnaireData } from '@/types/questionnaire';
import type { TravelItinerary } from '@/types/itinerary';
import type { ApiError } from '@/types/api';

const log = createLogger('api.enrich');

export const maxDuration = 90;

// Background enrichment: cap at 5 requests per IP per minute.
const isLimited = createSlidingWindowLimiter(5, 60 * 1000);

const MAX_ITINERARY_BYTES = 400_000;
const MAX_REQUEST_BYTES = 460_000; // itinerary + questionnaire (+ small fields)

interface EnrichRequestBody {
  tripId?: string;
  questionnaire?: unknown;
  itinerary?: unknown;
}

/**
 * POST /api/enrich — optional background enrichment for an already-generated
 * itinerary. NOT required for the initial itinerary: this endpoint upgrades a
 * plan with hotels, restaurants, dated events and daily routes after the
 * user has already seen it. If enrichment fails, the client simply keeps the
 * original itinerary.
 *
 * The payload carries the full validated itinerary + the questionnaire that
 * produced it (needed to re-run deterministic assembly without another AI
 * call). No private data is stored; nothing is persisted server-side.
 */
export async function POST(request: Request) {
  try {
    if (isLimited(clientIp(request))) {
      return NextResponse.json<ApiError>(
        { error: 'Too many requests. Please try again in a minute.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    if (Number(request.headers.get('content-length') ?? 0) > MAX_REQUEST_BYTES) {
      return NextResponse.json<ApiError>({ error: 'The request is too large.' }, { status: 413 });
    }

    const body = (await request.json()) as EnrichRequestBody;

    const itinerary = body?.itinerary as TravelItinerary | undefined;
    if (!itinerary || typeof itinerary !== 'object' || Array.isArray(itinerary)) {
      return NextResponse.json<ApiError>({ error: 'No itinerary was provided.' }, { status: 400 });
    }

    const contract = itinerarySchema.safeParse(itinerary);
    if (!contract.success) {
      log.warn('request_validation_error', {
        target: 'itinerary',
        issueCount: contract.error.issues.length,
      });
      return NextResponse.json<ApiError>({ error: 'The itinerary is malformed.' }, { status: 400 });
    }

    if (JSON.stringify(itinerary).length > MAX_ITINERARY_BYTES) {
      return NextResponse.json<ApiError>(
        { error: 'The itinerary is too large to enrich.' },
        { status: 400 }
      );
    }

    let questionnaire: QuestionnaireData;
    try {
      questionnaire = questionnaireSchema.parse(body?.questionnaire);
    } catch {
      return NextResponse.json<ApiError>(
        { error: 'The questionnaire is missing or malformed.' },
        { status: 400 }
      );
    }

    const startedAt = Date.now();
    const enriched = await enrichItinerary(questionnaire, contract.data);
    log.info('api.enrich.end', {
      durationMs: Date.now() - startedAt,
      tripId: typeof body?.tripId === 'string' ? body.tripId.slice(0, 64) : undefined,
    });

    return NextResponse.json({
      id: body?.tripId ?? null,
      itinerary: enriched,
    });
  } catch (error) {
    if (error instanceof ItineraryValidationError) {
      log.error('ai.validation_error', { status: 502, message: error.message });
      return NextResponse.json<ApiError>({ error: error.message }, { status: 502 });
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    log.error('request_error', {
      status: 500,
      errorName: error instanceof Error ? error.name : 'UnknownError',
      message,
      stack: error instanceof Error ? error.stack : undefined,
    });
    const clientMessage = isDev()
      ? `Enrichment failed: ${message}`
      : 'Enrichment failed. Your itinerary stays available as-is.';
    return NextResponse.json<ApiError>({ error: clientMessage }, { status: 500 });
  }
}