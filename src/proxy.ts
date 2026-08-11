import { NextRequest, NextResponse } from 'next/server';

// ============================================================
// Security proxy — per-request nonce + strict Content-Security-Policy.
//
// Next.js 16: `middleware` is deprecated, this is the `proxy` convention.
// A nonce-based CSP requires dynamic rendering (static pages are built
// without a request, so no nonce can be injected) — enforced via
// `export const dynamic = 'force-dynamic'` on the root layout.
//
// script-src is strict (no 'unsafe-inline'): only Next.js bundles carrying
// the per-request nonce may run. style-src keeps 'unsafe-inline' because the
// app uses React style attributes, which CSP cannot nonce (CSP applies
// nonces to elements, not attributes) and style injection is not an XSS
// vector in modern browsers.
// ============================================================

const isDev = process.env.NODE_ENV === 'development';

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

  const csp = [
    "default-src 'self'",
    // 'unsafe-eval' is required by React's dev tooling (error stack reconstruction).
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
  ].join('; ');

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set('Content-Security-Policy', csp);

  return response;
}

export const config = {
  matcher: [
    {
      // Pages only — API JSON, static assets and prefetches are excluded.
      source:
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|ico|svg|webp|jpg|jpeg)$).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
