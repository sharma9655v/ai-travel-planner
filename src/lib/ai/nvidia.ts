import OpenAI from 'openai';
import { buildSystemPrompt, buildUserPrompt } from './prompt';
import { buildBasicSystemPrompt, buildBasicUserPrompt } from '@/lib/planning/basicPrompt';
import { QuestionnaireData } from '@/types/questionnaire';
import { createLogger, isDev } from '@/lib/logger';

const log = createLogger('ai.nvidia');

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface NvidiaOptions {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  seed?: number;
  /** Model override (defaults to the env-configured model for the endpoint). */
  model?: string;
  /**
   * Optional reasoning budget for reasoning-class NIM models
   * (e.g. nemotron-3-*). Sends `reasoning_budget` and raises max_tokens
   * to leave room for the answer. 0 (default) = disabled.
   */
  reasoningBudget?: number;
  /**
   * Request structured JSON output via `response_format` (json_object).
   * Verified live against meta/llama-3.1-8b-instruct. Skipped automatically
   * when a reasoning budget is set (reasoning models reject the field).
   */
  jsonMode?: boolean;
}

// Single AI backend for the whole app: itinerary generation, refinement, and
// the chat assistant all flow through this one NVIDIA NIM client.
// Uses the OpenAI SDK pointed at NVIDIA's OpenAI-compatible endpoint.
//
// Models are environment-configurable so each endpoint can pick the right
// speed/cost trade-off:
//   AI_FAST_MODEL        — initial itinerary generation (fastest suitable model)
//   AI_STRONG_MODEL      — refinement / complex edits (keep the strong model here)
//   AI_CHAT_MODEL        — conversational assistant
//   AI_REASONING_BUDGET  — optional reasoning budget for reasoning-class fast
//                          models; raises max_tokens automatically (0 = off)
// The defaults keep the long-running production model everywhere, so behavior
// is unchanged until a faster model is explicitly configured and verified.
export const NVIDIA_URL = 'https://integrate.api.nvidia.com/v1';
const DEFAULT_MODEL = 'meta/llama-3.3-70b-instruct';

function modelFor(envKey: string): string {
  return process.env[envKey]?.trim() || DEFAULT_MODEL;
}

export function getFastModel(): string {
  return modelFor('AI_FAST_MODEL');
}

export function getStrongModel(): string {
  return modelFor('AI_STRONG_MODEL');
}

export function getChatModel(): string {
  return modelFor('AI_CHAT_MODEL');
}

/** Hard cap on a single upstream AI request (default 60s). */
export function aiRequestTimeoutMs(): number {
  const raw = Number(process.env.AI_REQUEST_TIMEOUT_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : 60_000;
}

/**
 * Optional reasoning budget applied to itinerary generation
 * (AI_REASONING_BUDGET). Only set it when the configured fast model is a
 * reasoning-class model (e.g. nvidia/nemotron-3-nano-30b-a3b); non-reasoning
 * models ignore the field. 0 = disabled (default).
 */
export function aiReasoningBudget(): number {
  const raw = Number(process.env.AI_REASONING_BUDGET);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 0;
}

/**
 * Structured JSON output on itinerary-generation calls (AI_JSON_MODE).
 * Enabled by default; set to 0/false/off to disable if the configured fast
 * model rejects `response_format`.
 */
export function aiJsonMode(): boolean {
  const raw = process.env.AI_JSON_MODE;
  if (raw == null) return true;
  return !['0', 'false', 'off', 'no'].includes(raw.trim().toLowerCase());
}

export class MissingApiKeyError extends Error {
  constructor() {
    super('NVIDIA_API_KEY is missing');
    this.name = 'MissingApiKeyError';
  }
}

/**
 * Upstream (NVIDIA) request failure. Carries the HTTP status and a
 * sanitized body hint so route handlers can surface the real cause in
 * development without exposing secrets.
 */
export class NvidiaApiError extends Error {
  readonly status: number;
  readonly statusText: string;

  constructor(status: number, statusText: string, bodyHint?: string) {
    const hint = bodyHint ? ` — ${bodyHint}` : '';
    super(`NVIDIA API error: ${status} ${statusText}${hint}`);
    this.name = 'NvidiaApiError';
    this.status = status;
    this.statusText = statusText;
  }
}

// Lazily initialized OpenAI client — created on first call so the env
// variable is read at runtime, not at module-load time. Tests stub the global
// fetch per test, so the cache is skipped under NODE_ENV=test to keep each
// test bound to its own mock.
let _client: OpenAI | null = null;

function getClient(): OpenAI {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    throw new MissingApiKeyError();
  }

  const useCache = process.env.NODE_ENV !== 'test';
  if (useCache && _client) {
    return _client;
  }

  const client = new OpenAI({
    baseURL: NVIDIA_URL,
    apiKey,
  });

  if (useCache) {
    _client = client;
  }

  return client;
}

// Low-level chat completion against NVIDIA. Reused by the full itinerary
// generator, the surgical itinerary editor, and the chat assistant.
// Every request carries an explicit AbortController timeout (AI_REQUEST_TIMEOUT_MS)
// and disables SDK retries: a slow/failing provider must surface quickly instead
// of being hidden behind long default timeout/retry values.
export async function callNvidiaChat(
  messages: ChatMessage[],
  options: NvidiaOptions = {}
): Promise<string> {
  const {
    maxTokens = 4096,
    temperature = 0.2,
    topP = 0.7,
    model,
    reasoningBudget = aiReasoningBudget(),
    jsonMode = false,
  } = options;

  const apiKey = process.env.NVIDIA_API_KEY;
  const activeModel = model ?? getStrongModel();
  const startedAt = Date.now();
  const timeoutMs = aiRequestTimeoutMs();

  // Reasoning models spend tokens on both the reasoning trace and the final
  // answer; cap max_tokens at budget + generous answer headroom so a complete
  // JSON answer always fits (a truncated answer would fail validation and
  // cascade into an expensive retry).
  const effectiveMaxTokens = reasoningBudget > 0 ? Math.max(maxTokens, reasoningBudget + 4096) : maxTokens;

  log.info('ai.request.start', {
    hasApiKey: Boolean(apiKey),
    model: activeModel,
    messageCount: messages.length,
    maxTokens: effectiveMaxTokens,
    temperature,
    topP,
    reasoningBudget,
    timeoutMs,
  });

  if (!apiKey) {
    log.warn('ai.request.missing_key', { model: activeModel });
    throw new MissingApiKeyError();
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const client = getClient();

    const body: Record<string, unknown> = {
      model: activeModel,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      temperature,
      top_p: topP,
      max_tokens: effectiveMaxTokens,
      stream: false,
    };
    if (reasoningBudget > 0) {
      body.reasoning_budget = reasoningBudget;
    }
    // Structured JSON output — the strongest guard against unparseable model
    // output. Skipped for reasoning-class models, which don't accept the field.
    if (jsonMode && aiJsonMode() && reasoningBudget === 0) {
      body.response_format = { type: 'json_object' };
    }

    const completion = await client.chat.completions.create(
      body as unknown as OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming,
      { timeout: timeoutMs, maxRetries: 0, signal: controller.signal }
    );

    const durationMs = Date.now() - startedAt;

    log.info('ai.request.end', {
      status: 200,
      model: activeModel,
      durationMs,
      promptTokens: completion.usage?.prompt_tokens,
      completionTokens: completion.usage?.completion_tokens,
      totalTokens: completion.usage?.total_tokens,
    });

    const message = completion.choices?.[0]?.message;
    if (!message) {
      log.error('ai.request.error', {
        model: activeModel,
        durationMs,
        error: 'no message in response',
      });
      throw new Error('No message in NVIDIA API response');
    }

    // The model may put content in `content`, or sometimes in `reasoning`
    const content =
      message.content ||
      (message as unknown as { reasoning?: string }).reasoning ||
      '';

    // Development-only raw response fingerprint, logged BEFORE any JSON
    // parsing: the first/last 300 chars of the raw output plus token and
    // finish-reason context make truncated or malformed model output debuggable.
    // Never logged outside development and never persisted — the raw content
    // can echo user trip data.
    if (isDev()) {
      log.info('ai.request.raw', {
        model: activeModel,
        provider: 'nvidia',
        finishReason: completion.choices?.[0]?.finish_reason ?? null,
        promptTokens: completion.usage?.prompt_tokens,
        completionTokens: completion.usage?.completion_tokens,
        totalTokens: completion.usage?.total_tokens,
        rawLength: content.length,
        head: content.slice(0, 300),
        tail: content.slice(-300),
      });
    }

    if (!content) {
      log.error('ai.request.error', {
        model: activeModel,
        durationMs,
        error: 'empty content in response',
      });
      throw new Error('No content returned from NVIDIA API');
    }

    return content;
  } catch (error) {
    const durationMs = Date.now() - startedAt;

    // Re-throw our own errors (MissingApiKeyError, etc.) as-is
    if (error instanceof MissingApiKeyError) throw error;
    if (error instanceof Error && error.message === 'No message in NVIDIA API response') throw error;
    if (error instanceof Error && error.message === 'No content returned from NVIDIA API') throw error;

    // Timeout / abort surfaced clearly instead of a cryptic SDK error.
    if (controller.signal.aborted || (error instanceof Error && error.name === 'AbortError')) {
      log.error('ai.request.error', {
        status: 'timeout',
        model: activeModel,
        durationMs,
        error: `Upstream request timed out after ${timeoutMs}ms`,
      });
      throw new NvidiaApiError(503, 'TimeoutError', `Upstream request timed out after ${timeoutMs}ms`);
    }

    // Handle OpenAI SDK errors (maps to NvidiaApiError for consistency)
    if (error instanceof OpenAI.APIError) {
      const bodyHint =
        typeof error.message === 'string' ? error.message.slice(0, 300) : undefined;
      log.error('ai.request.error', {
        status: error.status,
        statusText: error.type || 'APIError',
        model: activeModel,
        durationMs,
        responseBody: error.message?.slice(0, 500),
      });
      throw new NvidiaApiError(
        error.status || 500,
        error.type || 'APIError',
        bodyHint
      );
    }

    // Unknown errors
    log.error('ai.request.error', {
      model: activeModel,
      durationMs,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function callNvidiaGenerate(data: QuestionnaireData): Promise<string> {
  const systemMessage = buildSystemPrompt();
  const userMessage = buildUserPrompt(data);

  return callNvidiaChat(
    [
      { role: 'system', content: systemMessage },
      { role: 'user', content: userMessage },
    ],
    { maxTokens: 4096, temperature: 0.2, topP: 0.7, model: getFastModel(), reasoningBudget: aiReasoningBudget(), jsonMode: true }
  );
}

// Fast first pass: a compact day-by-day skeleton that the enrichment stage
// fills with verified hotels, restaurants, events, routes, weather and budget.
export async function callNvidiaBasicItinerary(
  data: QuestionnaireData,
  contextDigest: string
): Promise<string> {
  return callNvidiaChat(
    [
      { role: 'system', content: buildBasicSystemPrompt() },
      { role: 'user', content: buildBasicUserPrompt(data, contextDigest) },
    ],
    { maxTokens: 2048, temperature: 0.25, topP: 0.85, seed: 42, model: getFastModel(), reasoningBudget: aiReasoningBudget(), jsonMode: true }
  );
}

export function parseAIResponse(content: string) {
  // Strategy 1: Try parsing the raw content directly
  try {
    return JSON.parse(content.trim());
  } catch {
    // continue to next strategy
  }

  // Strategy 2: Extract from markdown code fences (json, JSON, or no label)
  const fenceMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)```/i);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch {
      // continue
    }
  }

  // Strategy 3: Find the first { ... } JSON object via brace matching.
  // Prose around the JSON is ignored, and any candidate that fails to parse
  // is skipped so a later, real object can still be found.
  const startCandidates: number[] = [];
  for (let i = 0; i < content.length; i++) {
    if (content[i] === '{') startCandidates.push(i);
  }
  for (const startIdx of startCandidates) {
    let depth = 0;
    let inString = false;
    let escape = false;
    for (let i = startIdx; i < content.length; i++) {
      const ch = content[i];
      if (escape) { escape = false; continue; }
      if (ch === '\\') { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === '{') depth++;
      if (ch === '}') {
        depth--;
        if (depth === 0) {
          const candidate = content.slice(startIdx, i + 1);
          try {
            return JSON.parse(candidate);
          } catch {
            break;
          }
        }
      }
    }
  }

  // Truncated snippet only — the raw response can echo user trip data.
  // In development the full raw response is fingerprinted by callNvidiaChat.
  if (isDev()) {
    log.error('ai.parse.error', { snippet: content.slice(0, 500) });
  }
  throw new Error('AI returned invalid JSON');
}