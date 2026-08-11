import { NextRequest, NextResponse } from 'next/server';
import { clientIp, createSlidingWindowLimiter } from '@/lib/rateLimit';
import { callNvidiaChat, getChatModel, MissingApiKeyError, type ChatMessage } from '@/lib/ai/nvidia';
import { createLogger, isDev } from '@/lib/logger';

const log = createLogger('api.chat');

export const maxDuration = 60;

// Paid AI endpoint: cap usage at 10 messages per IP per minute.
const isLimited = createSlidingWindowLimiter(10, 60 * 1000);

const MAX_MESSAGE_LENGTH = 2000;
const MAX_HISTORY_ENTRIES = 6;
const MAX_HISTORY_ENTRY_LENGTH = 4000;

const MAX_REQUEST_BYTES = 100_000; // rate-limited, but reject before parsing

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

    const { message, history } = await request.json();

    if (typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'No message was provided.' }, { status: 400 });
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Keep the message under ${MAX_MESSAGE_LENGTH} characters.` },
        { status: 400 }
      );
    }

    const systemPrompt = `You are an intelligent AI travel assistant integrated into a travel planning app. You help users:
- Modify their itineraries (swap days, add/remove activities)
- Get weather-aware suggestions
- Find cheaper alternatives for hotels/restaurants
- Suggest hidden gems and local experiences
- Optimize routes for efficiency
- Handle emergency travel situations

Be concise, friendly, and actionable. Keep responses under 150 words. Use emoji occasionally.`;

    const historyMessages: ChatMessage[] = Array.isArray(history)
      ? history
          .slice(-MAX_HISTORY_ENTRIES)
          .map((m: { role?: string; content?: string }) => ({
            // Only real conversation roles are forwarded — anything else
            // (e.g. a client-crafted `system` entry) is demoted to user.
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content:
              typeof m.content === 'string'
                ? m.content.slice(0, MAX_HISTORY_ENTRY_LENGTH)
                : '',
          }))
      : [];

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...historyMessages,
      { role: 'user', content: message },
    ];

    // Single NVIDIA client, shared with generation and refinement.
    const reply = await callNvidiaChat(messages, {
      maxTokens: 512,
      temperature: 0.8,
      topP: 0.9,
      model: getChatModel(),
    });

    return NextResponse.json({ reply });
  } catch (error) {
    if (error instanceof MissingApiKeyError) {
      log.warn('ai.request.missing_key', { status: 503 });
      return NextResponse.json(
        { reply: "I can't reach my travel brain right now. Please try again later. 🙌" },
        { status: 503 }
      );
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    log.error('request_error', {
      status: 502,
      errorName: error instanceof Error ? error.name : 'UnknownError',
      message,
      stack: error instanceof Error ? error.stack : undefined,
    });
    // Development: surface the real cause. Production: generic copy only —
    // details live in server logs.
    const clientError = isDev()
      ? message
      : "I couldn't reach the assistant right now. Please try again.";
    return NextResponse.json({ error: clientError }, { status: 502 });
  }
}
