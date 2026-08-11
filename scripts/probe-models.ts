import OpenAI from 'openai';
import fs from 'node:fs';
import path from 'node:path';

// ============================================================
// Model bake-off against the NVIDIA endpoint (development tooling).
//
// Usage: npm run probe:models
//
// Loads NVIDIA_API_KEY from .env.local (never printed), then times each
// candidate model on the exact basic-itinerary task. Pick the fastest model
// that returns valid JSON and set it as AI_FAST_MODEL.
// ============================================================

const CANDIDATES = [
  'meta/llama-3.1-8b-instruct',
  'mistralai/mistral-nemo-12b-instruct',
  'google/gemma-2-9b-it',
  'meta/llama-3.3-70b-instruct',
];

function loadEnvLocal(): void {
  const file = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/i);
    if (!match) continue;
    const [key, raw] = [match[1], match[2]];
    const value = raw.replace(/^["']|["']$/g, '');
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

const PROMPT = `You are a travel planner AI. Respond with ONLY valid JSON, no markdown.
Return a 2-day itinerary for Dubai in this exact schema:
{"highlights":["string"],"dailyItinerary":[{"day":1,"date":"string","title":"string","summary":"string","activities":[{"time":"HH:MM","endTime":"HH:MM","name":"string","description":"string","location":"string","latitude":25.2,"longitude":55.27,"duration":"string","category":"sightseeing","estimatedCost":0,"tips":"string"}]}]}`;

async function probe(model: string, timeoutMs: number): Promise<{ ms: number; ok: boolean; bytes: number; kind: 'timeout' | 'error' | 'parse' | 'ok' }> {
  const startedAt = Date.now();
  try {
    const client = new OpenAI({
      baseURL: 'https://integrate.api.nvidia.com/v1',
      apiKey: process.env.NVIDIA_API_KEY,
    });
    const completion = await client.chat.completions.create(
      {
        model,
        messages: [
          { role: 'system', content: PROMPT },
          { role: 'user', content: 'Generate the itinerary for Dubai, 25.27N 55.30E, 2 days, mid-range budget.' },
        ],
        temperature: 0.2,
        max_tokens: 1600,
      },
      { timeout: timeoutMs, maxRetries: 0 }
    );
    const content = completion.choices?.[0]?.message?.content ?? '';
    const parsedOk = (() => {
      try {
        const j = JSON.parse(content);
        return Array.isArray(j.dailyItinerary) && j.dailyItinerary.length === 2;
      } catch {
        return false;
      }
    })();
    return { ms: Date.now() - startedAt, ok: parsedOk, bytes: content.length, kind: parsedOk ? 'ok' : 'parse' };
  } catch (error) {
    const name = error instanceof Error ? error.name : 'Unknown';
    const timedOut = name === 'AbortError' || (error instanceof Error && error.message.includes('timeout'));
    return { ms: Date.now() - startedAt, ok: false, bytes: 0, kind: timedOut ? 'timeout' : 'error' };
  }
}

async function main(): Promise<void> {
  loadEnvLocal();
  if (!process.env.NVIDIA_API_KEY) {
    console.error('[probe] NVIDIA_API_KEY not found in .env.local');
    process.exit(1);
  }

  console.log('[probe] timing candidate models on the basic-itinerary task…\n');
  for (const model of CANDIDATES) {
    const timeoutMs = model === 'meta/llama-3.3-70b-instruct' ? 150_000 : 45_000;
    const result = await probe(model, timeoutMs);
    console.log(
      `[probe] ${model.padEnd(34)} ${String(result.ms).padStart(5)}ms  ${result.kind.padEnd(8)} ${result.kind === 'ok' ? `(${result.bytes} bytes JSON)` : ''}`
    );
  }
}

main().catch((error) => {
  console.error('[probe] fatal:', error);
  process.exit(1);
});