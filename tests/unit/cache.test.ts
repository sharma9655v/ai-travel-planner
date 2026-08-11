import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryCacheProvider, UpstashCacheProvider, getOrCompute, isCacheEnabled } from '@/lib/cache';

// ============================================================
// Cache layer tests — the cache must be a pure accelerator: never a
// single point of failure, never serving stale data past its TTL, and
// disabled entirely in the test environment.
// ============================================================

describe('MemoryCacheProvider', () => {
  it('stores and reads JSON values', async () => {
    const cache = new MemoryCacheProvider();
    await cache.set('a', JSON.stringify({ ok: true }), 60);
    expect(await cache.get('a')).toBe(JSON.stringify({ ok: true }));
  });

  it('expires entries whose TTL has elapsed', async () => {
    const cache = new MemoryCacheProvider();
    await cache.set('a', 'v', 0);
    expect(await cache.get('a')).toBeNull();
  });

  it('keeps entries without a TTL', async () => {
    const cache = new MemoryCacheProvider();
    await cache.set('a', 'v');
    expect(await cache.get('a')).toBe('v');
  });
});

describe('getOrCompute', () => {
  afterEach(() => {
    delete process.env.CACHE_ENABLED;
    vi.unstubAllGlobals();
  });

  it('computes once, then serves the cached value', async () => {
    process.env.CACHE_ENABLED = 'true';
    let calls = 0;
    const compute = async () => {
      calls += 1;
      return { n: calls };
    };

    const first = await getOrCompute('test-scope', ['k1'], 60, compute);
    const second = await getOrCompute('test-scope', ['k1'], 60, compute);

    expect(first).toEqual({ n: 1 });
    expect(second).toEqual({ n: 1 });
    expect(calls).toBe(1);
  });

  it('does not cache null results (failed providers are retried live)', async () => {
    process.env.CACHE_ENABLED = 'true';
    let calls = 0;
    const compute = async () => {
      calls += 1;
      return calls === 1 ? null : { ok: true };
    };

    expect(await getOrCompute('test-scope', ['k2'], 60, compute)).toBeNull();
    expect(await getOrCompute('test-scope', ['k2'], 60, compute)).toEqual({ ok: true });
    expect(calls).toBe(2);
  });

  it('deduplicates concurrent computations for the same key', async () => {
    process.env.CACHE_ENABLED = 'true';
    let calls = 0;
    const compute = async () => {
      calls += 1;
      await new Promise((resolve) => setTimeout(resolve, 30));
      return { ok: true };
    };

    const [first, second] = await Promise.all([
      getOrCompute('test-scope', ['k3'], 60, compute),
      getOrCompute('test-scope', ['k3'], 60, compute),
    ]);

    expect(first).toEqual({ ok: true });
    expect(second).toEqual({ ok: true });
    expect(calls).toBe(1);
  });
});

describe('UpstashCacheProvider', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('reads values through the Upstash REST API', async () => {
    const fetchMock = vi.fn(
      async () => new Response(JSON.stringify({ result: '{"ok":true}' }), { status: 200 })
    );
    vi.stubGlobal('fetch', fetchMock);

    const provider = new UpstashCacheProvider('https://sub.upstash.io', 'token');
    expect(await provider.get('key')).toBe('{"ok":true}');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://sub.upstash.io/get/key',
      expect.objectContaining({ headers: { Authorization: 'Bearer token' } })
    );
  });

  it('returns null on non-OK responses', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 404 })));

    const provider = new UpstashCacheProvider('https://sub.upstash.io', 'token');
    expect(await provider.get('key')).toBeNull();
  });

  it('writes values through the Upstash REST API', async () => {
    const fetchMock = vi.fn(async () => new Response('OK', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const provider = new UpstashCacheProvider('https://sub.upstash.io', 'token');
    await provider.set('key', 'value', 120);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://sub.upstash.io/set/key/value/120',
      expect.objectContaining({ method: 'POST' })
    );
  });
});

describe('cache configuration', () => {
  it('is disabled in the test environment', () => {
    delete process.env.CACHE_ENABLED;
    expect(process.env.CACHE_ENABLED).toBeUndefined();
    expect(isCacheEnabled()).toBe(false);
  });
});