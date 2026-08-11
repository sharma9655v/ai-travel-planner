'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#090B10', fontFamily: 'inherit' }}>
        <main
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.25rem',
          }}
        >
          <div
            style={{
              maxWidth: 420,
              width: '100%',
              padding: '2.25rem 1.75rem',
              textAlign: 'center',
              background: 'rgba(15, 17, 24, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 'var(--radius-xl)',
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 'var(--radius-xl)',
                background: 'linear-gradient(135deg, rgba(39, 242, 255, 0.12), rgba(177, 109, 255, 0.12))',
                border: '1px solid rgba(39, 242, 255, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
                boxShadow: '0 0 30px rgba(39, 242, 255, 0.18)',
              }}
            >
              <svg width="30" height="30" viewBox="0 0 64 64" fill="none" aria-hidden="true">
                <defs>
                  <linearGradient id="atp-global-error-g" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#27F2FF" />
                    <stop offset="1" stopColor="#B16DFF" />
                  </linearGradient>
                </defs>
                <circle cx="32" cy="32" r="19.5" fill="none" stroke="url(#atp-global-error-g)" strokeWidth="2.5" />
                <path d="M32 19.5 L36 32 L32 44.5 L28 32 Z" fill="url(#atp-global-error-g)" />
              </svg>
            </div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', color: '#FFF' }}>
              Something went wrong
            </h1>
            <p
              style={{
                fontSize: '0.8125rem',
                color: 'rgba(255, 255, 255, 0.6)',
                lineHeight: 1.6,
                marginBottom: '1.5rem',
              }}
            >
              The app hit an unexpected error. Reload to get back on track.
            </p>
            <button
              onClick={() => reset()}
              style={{
                padding: '0.8125rem 1.5rem',
                background: 'linear-gradient(135deg, #27F2FF 0%, #B16DFF 100%)',
                color: '#090B10',
                border: 'none',
                borderRadius: 'var(--radius-xl)',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '0.875rem',
              }}
            >
              Reload
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
