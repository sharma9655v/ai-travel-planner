import { NextResponse } from 'next/server';
import { sendItineraryEmail, isEmailConfigured } from '@/lib/email';
import { clientIp, createSlidingWindowLimiter } from '@/lib/rateLimit';
import { createLogger } from '@/lib/logger';
import type { TravelItinerary } from '@/types/itinerary';

const log = createLogger('api.email-itinerary');

// Rate limit: 3 emails per IP per minute
const isLimited = createSlidingWindowLimiter(3, 60 * 1000);

interface EmailItineraryRequest {
  email: string;
  itinerary: TravelItinerary;
  destination: string;
}

// Simple email regex — we're not trying to be RFC 5322 compliant, just
// catching obvious typos before hitting the SMTP server.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    if (isLimited(clientIp(req))) {
      return NextResponse.json(
        { error: 'Too many email requests. Please try again in a minute.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    if (!isEmailConfigured()) {
      return NextResponse.json(
        { error: 'Email is not configured on this server.' },
        { status: 503 }
      );
    }

    const body = (await req.json()) as EmailItineraryRequest;

    if (!body.email || !EMAIL_RE.test(body.email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    if (!body.itinerary || !body.destination) {
      return NextResponse.json(
        { error: 'Missing itinerary or destination.' },
        { status: 400 }
      );
    }

    await sendItineraryEmail(body.email, body.itinerary, body.destination);

    log.info('email.sent', { destination: body.destination });

    return NextResponse.json({ message: 'Itinerary sent to your email!' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    log.error('email.error', { message });
    return NextResponse.json(
      { error: 'Failed to send email. Please try again.' },
      { status: 500 }
    );
  }
}
