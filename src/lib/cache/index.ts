import { createLogger } from '@/lib/logger';

// ============================================================
// Cache layer — isolates slow-but-stable planning data (destination
// coordinates, OSM places/hotels/restaurants, route metadata) from the
// critical path of trip generation. Weather uses a short TTL; user data is
// never cached.
//
// Providers:
//   - memory   (default) — in-process Map. Zero setup, good for dev/single
//     instance. Not shared across serverless instances.
//   - upstash  — Upstash Redis REST API over fetch (no new dependencies).
//     Set CACHE_PROVIDER=upstash plus CACHE_REDIS_REST_URL and
//     CACHE_REDIS_REST_TOKEN. Compatible with any Upstash-compatible
//     REST endpoint (e.g. Vercel Marketplace Redis).
//
// The cache is strictly optional: every access is wrapped in try/catch and
// falls back to the live provider. A missing/broken cache never blocks
// itinerary generation.
// ============================================================

const log = createLogger('cache');

/** Cache is disabled under tests so stubbed providers stay deterministic. */
export function isCacheEnabled(): boolean {
  // Explicit opt-in lets tests exercise the cache layer itself.
  if (process.env.CACHE_ENABLED === 'true') return true;
  if (process.env.NODE_ENV === 'test') return false;
  return process.env.CACHE_ENABLED !== 'false';
}

// ------------------------------------------------------------
// TTLs (seconds). Stable POI/route data survives for a week;
// weather is only ever cached for minutes.
// ------------------------------------------------------------

export const CACHE_TTL = {
  destination: 30 * 24 * 60 * 60, // 30 days — coordinates of a place barely move
  places: 7 * 24 * 60 * 60, // 7 days — attractions / POIs near a destination
  hotels: 7 * 24 * 60 * 60,
  restaurants: 7 * 24 * 60 * 60,
  routes: 7 * 24 * 60 * 60, // OSRM distance/duration metadata is stable
  weather: 15 * 60, // 15 minutes
} as const;

export interface CacheProvider {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
}

// ------------------------------------------------------------
// In-memory provider (single process)
// ------------------------------------------------------------

const MAX_MEMORY_ENTRIES = 2_000;

export class MemoryCacheProvider implements CacheProvider {
  private store = new Map<string, { value: string; expiresAt: number }>();

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt > 0 && entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.store.size >= MAX_MEMORY_ENTRIES && !this.store.has(key)) {
      const oldest = this.store.keys().next().value;
      if (oldest !== undefined) this.store.delete(oldest);
    }
    let expiresAt = ttlSeconds === undefined ? 0 : Date.now() + ttlSeconds * 1000;
    // TTL 0 (or an immediate same-millisecond read) must count as expired.
    if (expiresAt !== 0 && expiresAt <= Date.now()) expiresAt = Date.now() - 1;
    this.store.set(key, {
      value,
      expiresAt,
    });
  }
}

// ------------------------------------------------------------
// Upstash Redis REST provider (production, zero dependencies)
// ------------------------------------------------------------

export class UpstashCacheProvider implements CacheProvider {
  private readonly url: string;
  private readonly token: string;

  constructor(url: string, token: string) {
    this.url = url.replace(/\/$/, '');
    this.token = token;
  }

  async get(key: string): Promise<string | null> {
    const response = await fetch(`${this.url}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${this.token}` },
      signal: AbortSignal.timeout(3_000),
    });
    if (!response.ok) return null;
    const body = (await response.json()) as { result?: string | null };
    return typeof body.result === 'string' ? body.result : null;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const ttl = ttlSeconds === undefined ? '0' : String(ttlSeconds);
    const response = await fetch(`${this.url}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}/${ttl}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.token}` },
      signal: AbortSignal.timeout(3_000),
    });
    if (!response.ok) {
      throw new Error(`Upstash set failed: ${response.status}`);
    }
  }
}

// ------------------------------------------------------------
// Provider selection + JSON helpers
// ------------------------------------------------------------

let _provider: CacheProvider | null = null;

function createProvider(): CacheProvider {
  const kind = process.env.CACHE_PROVIDER ?? 'memory';
  if (kind === 'upstash') {
    const url = process.env.CACHE_REDIS_REST_URL;
    const token = process.env.CACHE_REDIS_REST_TOKEN;
    if (url && token) {
      log.info('cache.provider', { provider: 'upstash' });
      return new UpstashCacheProvider(url, token);
    }
    log.warn('cache.provider', {
      provider: 'memory',
      reason: 'CACHE_PROVIDER=upstash but CACHE_REDIS_REST_URL/CACHE_REDIS_REST_TOKEN missing',
    });
  }
  log.info('cache.provider', { provider: 'memory' });
  return new MemoryCacheProvider();
}

function getProvider(): CacheProvider {
  if (!_provider) _provider = createProvider();
  return _provider;
}

function buildKey(scope: string, parts: unknown[]): string {
  const suffix = parts
    .map((part) => String(part ?? '').toLowerCase().replace(/\s+/g, ' ').trim())
    .join('|');
  return `atp:${scope}:${suffix}`;
}

/** Rounds coordinates so cache keys stay stable across tiny jitter. */
export function coordKey(latitude: number, longitude: number, precision = 4): string {
  return `${latitude.toFixed(precision)},${longitude.toFixed(precision)}`;
}

export function destinationCoordKey(latitude: number, longitude: number): string {
  return coordKey(latitude, longitude);
}

// ------------------------------------------------------------
// Public helpers — every access degrades gracefully. A cache
// failure behaves like a miss and never surfaces to the caller.
// ------------------------------------------------------------

export async function cacheGetJson<T>(scope: string, parts: unknown[]): Promise<T | null> {
  if (!isCacheEnabled()) return null;
  try {
    const raw = await getProvider().get(buildKey(scope, parts));
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (error) {
    log.warn('cache.get_failed', {
      scope,
      errorName: error instanceof Error ? error.name : 'UnknownError',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

export async function cacheSetJson(
  scope: string,
  parts: unknown[],
  value: unknown,
  ttlSeconds?: number
): Promise<void> {
  if (!isCacheEnabled()) return;
  try {
    await getProvider().set(buildKey(scope, parts), JSON.stringify(value), ttlSeconds);
  } catch (error) {
    log.warn('cache.set_failed', {
      scope,
      errorName: error instanceof Error ? error.name : 'UnknownError',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * In-flight computations, keyed by full cache key. Concurrent getOrCompute
 * calls for the same key share ONE compute instead of each issuing a
 * duplicate upstream request (e.g. two simultaneous trip generations for the
 * same destination must not send two Overpass queries).
 */
const inFlightComputes = new Map<string, Promise<unknown>>();

/**
 * getOrCompute — cached value if present, otherwise compute (uncached on
 * failure: only verified successful results are ever stored). Concurrent
 * calls for the same key are deduplicated onto a single in-flight compute.
 */
export async function getOrCompute<T>(
  scope: string,
  parts: unknown[],
  ttlSeconds: number,
  compute: () => Promise<T | null>
): Promise<T | null> {
  const startedAt = Date.now();
  const cached = await cacheGetJson<T>(scope, parts);
  if (cached !== null) {
    log.info('cache.hit', { scope, durationMs: Date.now() - startedAt });
    return cached;
  }

  const key = buildKey(scope, parts);
  const existing = inFlightComputes.get(key);
  if (existing) {
    log.info('cache.inflight_share', { scope, durationMs: Date.now() - startedAt });
    return (await existing) as T | null;
  }

  log.info('cache.miss', { scope, durationMs: Date.now() - startedAt });
  const promise = compute()
    .then(async (computed) => {
      if (computed !== null) {
        await cacheSetJson(scope, parts, computed, ttlSeconds);
      }
      return computed;
    })
    .finally(() => {
      inFlightComputes.delete(key);
    });
  inFlightComputes.set(key, promise);
  return (await promise) as T | null;
}