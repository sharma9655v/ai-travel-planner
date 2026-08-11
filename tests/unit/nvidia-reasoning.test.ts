import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { aiReasoningBudget, callNvidiaGenerate } from '@/lib/ai/nvidia';
import { createDefaultQuestionnaireData } from '@/types/questionnaire';

const questionnaire = createDefaultQuestionnaireData();

let fetchMock: ReturnType<typeof vi.fn>;

function lastRequestBody(): Record<string, unknown> {
  const [, second] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
  return JSON.parse(String(second.body)) as Record<string, unknown>;
}

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  vi.stubEnv('NODE_ENV', 'test');
  vi.stubEnv('NVIDIA_API_KEY', 'test-key');
  vi.stubEnv('AI_FAST_MODEL', 'nvidia/nemotron-3-nano-30b-a3b');
  fetchMock.mockResolvedValue(
    new Response(
      JSON.stringify({
        id: 'x',
        object: 'chat.completion',
        created: 1,
        model: 'nvidia/nemotron-3-nano-30b-a3b',
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
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('aiReasoningBudget', () => {
  it('reads AI_REASONING_BUDGET from the environment', () => {
    vi.stubEnv('AI_REASONING_BUDGET', '8192');
    expect(aiReasoningBudget()).toBe(8192);
  });

  it('returns 0 when unset or invalid', () => {
    vi.unstubAllEnvs();
    vi.stubEnv('NVIDIA_API_KEY', 'test-key');
    expect(aiReasoningBudget()).toBe(0);
    vi.stubEnv('AI_REASONING_BUDGET', 'not-a-number');
    expect(aiReasoningBudget()).toBe(0);
  });
});

describe('callNvidiaGenerate with reasoning budget', () => {
  it('sends reasoning_budget and raises max_tokens above the budget', async () => {
    vi.stubEnv('AI_REASONING_BUDGET', '16384');

    await callNvidiaGenerate(questionnaire);

    const body = lastRequestBody();
    expect(body.model).toBe('nvidia/nemotron-3-nano-30b-a3b');
    expect(body.reasoning_budget).toBe(16384);
    expect(body.max_tokens).toBeGreaterThanOrEqual(16384 + 1024);
  });

  it('omits reasoning_budget when the budget is 0', async () => {
    vi.unstubAllEnvs();
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('NVIDIA_API_KEY', 'test-key');

    await callNvidiaGenerate(questionnaire);

    const body = lastRequestBody();
    expect(body.reasoning_budget).toBeUndefined();
    expect(body.max_tokens).toBe(4096);
  });
});