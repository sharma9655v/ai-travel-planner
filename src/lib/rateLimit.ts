// Sliding-window per-IP rate limiting for API routes.
// In-memory only: limits apply per serverless instance. This matches the
// existing in-app throttles (share creation) and is a deliberate zero-config
// choice — swap for a shared store (Redis/Supabase) at scale.
export function createSlidingWindowLimiter(maxHits: number, windowMs: number) {
  const hits = new Map<string, number[]>();

  // Returns true when the caller has exceeded the limit for this window.
  return function isLimited(ip: string): boolean {
    const now = Date.now();
    const recent = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
    if (recent.length >= maxHits) {
      hits.set(ip, recent);
      return true;
    }
    recent.push(now);
    hits.set(ip, recent);
    return false;
  };
}

export function clientIp(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for');
  return (fwd ?? 'local').split(',')[0].trim().slice(0, 64) || 'local';
}
