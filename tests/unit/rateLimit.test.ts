import { afterEach, describe, expect, it, vi } from 'vitest';
import { clientIp, createSlidingWindowLimiter } from '@/lib/rateLimit';

describe('createSlidingWindowLimiter', () => {
  afterEach(() => vi.useRealTimers());

  it('allows hits up to the limit, then blocks', () => {
    const isLimited = createSlidingWindowLimiter(3, 60_000);
    expect(isLimited('1.1.1.1')).toBe(false);
    expect(isLimited('1.1.1.1')).toBe(false);
    expect(isLimited('1.1.1.1')).toBe(false);
    expect(isLimited('1.1.1.1')).toBe(true);
  });

  it('tracks each IP independently', () => {
    const isLimited = createSlidingWindowLimiter(2, 60_000);
    expect(isLimited('1.1.1.1')).toBe(false);
    expect(isLimited('1.1.1.1')).toBe(false);
    expect(isLimited('1.1.1.1')).toBe(true);
    expect(isLimited('2.2.2.2')).toBe(false);
  });

  it('expires hits after the window slides', () => {
    vi.useFakeTimers();
    const isLimited = createSlidingWindowLimiter(3, 1_000);
    isLimited('1.1.1.1');
    isLimited('1.1.1.1');
    isLimited('1.1.1.1');
    expect(isLimited('1.1.1.1')).toBe(true);
    vi.advanceTimersByTime(1_001);
    expect(isLimited('1.1.1.1')).toBe(false);
  });
});

describe('clientIp', () => {
  it('falls back to local without a forwarding header', () => {
    expect(clientIp(new Request('http://localhost/api/chat'))).toBe('local');
  });

  it('takes the first x-forwarded-for address', () => {
    const request = new Request('http://localhost/api/chat', {
      headers: { 'x-forwarded-for': '1.2.3.4, 9.9.9.9' },
    });
    expect(clientIp(request)).toBe('1.2.3.4');
  });

  it('truncates absurdly long addresses', () => {
    const request = new Request('http://localhost/api/chat', {
      headers: { 'x-forwarded-for': 'a'.repeat(100) },
    });
    expect(clientIp(request)).toHaveLength(64);
  });
});
