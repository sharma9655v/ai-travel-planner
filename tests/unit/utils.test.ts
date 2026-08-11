import { describe, expect, it } from 'vitest';
import { createItineraryId, formatCurrency, safeRedirectPath } from '@/lib/utils';

describe('safeRedirectPath', () => {
  it('falls back for missing values', () => {
    expect(safeRedirectPath(undefined)).toBe('/');
    expect(safeRedirectPath(null)).toBe('/');
    expect(safeRedirectPath('')).toBe('/');
  });

  it('accepts same-origin paths', () => {
    expect(safeRedirectPath('/dashboard')).toBe('/dashboard');
    expect(safeRedirectPath('/plan?from=share')).toBe('/plan?from=share');
  });

  it('rejects absolute and protocol-relative URLs', () => {
    expect(safeRedirectPath('https://evil.example.com')).toBe('/');
    expect(safeRedirectPath('http://evil.example.com/phish')).toBe('/');
    expect(safeRedirectPath('//evil.example.com')).toBe('/');
  });

  it('rejects backslash and control-character paths', () => {
    expect(safeRedirectPath('/\\evil.example.com')).toBe('/');
    expect(safeRedirectPath('/foo\r\nLocation: /phish')).toBe('/');
  });

  it('rejects non-slash-prefixed values and uses the custom fallback', () => {
    expect(safeRedirectPath('dashboard')).toBe('/');
    expect(safeRedirectPath('https://evil.example.com', '/login')).toBe('/login');
  });
});

describe('createItineraryId', () => {
  it('returns a 12-char hex id and is unique', () => {
    const a = createItineraryId();
    const b = createItineraryId();
    expect(a).toMatch(/^[0-9a-f]{12}$/);
    expect(b).toMatch(/^[0-9a-f]{12}$/);
    expect(a).not.toBe(b);
  });
});

describe('formatCurrency', () => {
  it('formats INR with en-IN grouping', () => {
    expect(formatCurrency(1000)).toContain('₹');
    expect(formatCurrency(150000)).toContain('1,50,000');
  });

  it('formats other currencies', () => {
    expect(formatCurrency(1500, 'USD')).toContain('1,500');
    expect(formatCurrency(250000, 'JPY')).toContain('2,50,000');
  });
});
