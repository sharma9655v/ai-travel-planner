export function formatCurrency(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function createItineraryId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  }
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

// Only allow same-origin paths for redirects. Rejects absolute URLs,
// protocol-relative URLs, backslash paths and any control characters.
export function safeRedirectPath(
  path: string | null | undefined,
  fallback = '/'
): string {
  if (!path) return fallback;
  if (!path.startsWith('/') || path.startsWith('//') || path.startsWith('/\\')) {
    return fallback;
  }
  if (/[\r\n]/.test(path)) return fallback;
  return path;
}
