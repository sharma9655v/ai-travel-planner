import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/chat/route';

function chatRequest(body: unknown) {
  return new NextRequest('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

function nvidiaOk(content: string) {
  return async () =>
    new Response(JSON.stringify({ choices: [{ message: { content } }] }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
}

describe('POST /api/chat', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('returns 503 when the AI key is not configured', async () => {
    vi.stubEnv('NVIDIA_API_KEY', '');
    const response = await POST(chatRequest({ message: 'Hello' }));
    expect(response.status).toBe(503);
  });

  it('validates the message', async () => {
    vi.stubEnv('NVIDIA_API_KEY', 'test-key');
    expect((await POST(chatRequest({ message: '   ' }))).status).toBe(400);
    expect((await POST(chatRequest({ message: 42 }))).status).toBe(400);
    expect((await POST(chatRequest({ message: 'x'.repeat(2001) }))).status).toBe(400);
  });

  it('returns a 502 for malformed JSON bodies', async () => {
    vi.stubEnv('NVIDIA_API_KEY', 'test-key');
    const response = await POST(chatRequest('this is not json'));
    expect(response.status).toBe(502);
  });

  it('replies with the assistant content', async () => {
    vi.stubEnv('NVIDIA_API_KEY', 'test-key');
    vi.stubGlobal('fetch', vi.fn(nvidiaOk('Try TeamLab Planets! ✨')));

    const response = await POST(chatRequest({ message: 'What should I do in Tokyo?' }));
    expect(response.status).toBe(200);
    expect((await response.json()).reply).toBe('Try TeamLab Planets! ✨');
  });

  it('demotes non-assistant history roles and caps history', async () => {
    vi.stubEnv('NVIDIA_API_KEY', 'test-key');
    const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(
      async () =>
        new Response(JSON.stringify({ choices: [{ message: { content: 'ok' } }] }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
    );
    vi.stubGlobal('fetch', fetchMock);

    const history = [
      { role: 'system', content: 'a'.repeat(5000) },
      { role: 'user', content: 'hi' },
      { role: 'assistant', content: 'hello' },
      { role: 'admin', content: 'x' },
      { role: 'user', content: '1' },
      { role: 'user', content: '2' },
      { role: 'user', content: '3' },
      { role: 'user', content: '4' },
    ];
    await POST(chatRequest({ message: 'ping', history }));

    const sentBody = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    const forwarded = sentBody.messages.slice(1, -1);
    expect(forwarded).toHaveLength(6);
    expect(forwarded.filter((m: { role: string }) => m.role === 'system')).toHaveLength(0);
    expect(forwarded.filter((m: { role: string }) => m.role === 'assistant')).toHaveLength(1);
    expect(forwarded.every((m: { content: string }) => m.content.length <= 4000)).toBe(true);
    expect(forwarded[forwarded.length - 1].role).toBe('user');
    expect(forwarded[forwarded.length - 1].content).toBe('4');
  });

  it('degrades to 502 when the provider fails', async () => {
    vi.stubEnv('NVIDIA_API_KEY', 'test-key');
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 500 })));

    const response = await POST(chatRequest({ message: 'hi' }));
    expect(response.status).toBe(502);
    // In development the real cause is returned instead of the generic copy.
    expect((await response.json()).error).toContain('NVIDIA');
  });

  it('returns the generic 502 copy in production', async () => {
    vi.stubEnv('NVIDIA_API_KEY', 'test-key');
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 500 })));

    const response = await POST(chatRequest({ message: 'hi' }));
    expect(response.status).toBe(502);
    expect((await response.json()).error).toContain("couldn't reach");
  });

  it('returns 429 after the per-IP limit is hit', async () => {
    vi.resetModules();
    vi.stubEnv('NVIDIA_API_KEY', '');
    const fresh = await import('@/app/api/chat/route');

    let last: Response | null = null;
    for (let i = 0; i < 11; i++) {
      last = await fresh.POST(chatRequest({ message: `m${i}` }));
    }
    expect(last?.status).toBe(429);
    expect(last?.headers.get('Retry-After')).toBe('60');
  });
});
