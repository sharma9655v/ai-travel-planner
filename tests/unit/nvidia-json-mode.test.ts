import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { aiJsonMode, callNvidiaBasicItinerary, callNvidiaGenerate } from '@/lib/ai/nvidia';
import { createDefaultQuestionnaireData } from '@/types/questionnaire';

const questionnaire = createDefaultQuestionnaireData();

let fetchMock: ReturnType<typeof vi.fn>;

function lastRequestBody(): Record<string, unknown> {
  const [, second] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
  return JSON.parse(String(second.body)) as Record<string, unknown>;
}

function stubCompletion(): void {
  fetchMock.mockResolvedValue(
    new Response(
      JSON.stringify({
        id: 'x',
        object: 'chat.completion',
        created: 1,
        model: 'meta/llama-3.1-8b-instruct',
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: '{"ok":true}' },
            finish_reason: 'stop',
          },
        ],
        usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  );
}

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  vi.stubEnv('NODE_ENV', 'test');
  vi.stubEnv('NVIDIA_API_KEY', 'test-key');
  vi.stubEnv('AI_FAST_MODEL', 'meta/llama-3.1-8b-instruct');
  stubCompletion();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('aiJsonMode', () => {
  it('is enabled by default', () => {
    expect(aiJsonMode()).toBe(true);
  });

  it('respects explicit disable flags', () => {
    for (const value of ['0', 'false', 'off', 'no']) {
      vi.stubEnv('AI_JSON_MODE', value);
      expect(aiJsonMode()).toBe(false);
    }
  });
});

describe('structured JSON output (response_format)', () => {
  it('sends response_format json_object on itinerary generation', async () => {
    await callNvidiaGenerate(questionnaire);

    const body = lastRequestBody();
    expect(body.response_format).toEqual({ type: 'json_object' });
  });

  it('sends response_format json_object on the basic itinerary pass', async () => {
    await callNvidiaBasicItinerary(questionnaire, 'context digest');

    const body = lastRequestBody();
    expect(body.response_format).toEqual({ type: 'json_object' });
  });

  it('omits response_format when AI_JSON_MODE is disabled', async () => {
    vi.stubEnv('AI_JSON_MODE', '0');

    await callNvidiaGenerate(questionnaire);

    const body = lastRequestBody();
    expect(body.response_format).toBeUndefined();
  });

  it('omits response_format for reasoning-class models', async () => {
    vi.stubEnv('AI_REASONING_BUDGET', '8192');

    await callNvidiaGenerate(questionnaire);

    const body = lastRequestBody();
    expect(body.reasoning_budget).toBe(8192);
    expect(body.response_format).toBeUndefined();
  });
});
