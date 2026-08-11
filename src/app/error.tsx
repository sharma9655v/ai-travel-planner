'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Route error:', error);
  }, [error]);

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-bg)',
        padding: '1.25rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient background */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          width: 420,
          height: 420,
          borderRadius: '50%',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background:
            'radial-gradient(circle, rgba(39, 242, 255, 0.07) 0%, transparent 65%), radial-gradient(circle, rgba(177, 109, 255, 0.06) 0%, transparent 70%)',
          filter: 'blur(50px)',
          pointerEvents: 'none',
        }}
      />

      <div
        className="glass-card-static"
        style={{
          maxWidth: 420,
          width: '100%',
          padding: '2.5rem 1.75rem',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        {/* Brand mark */}
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
              <linearGradient id="atp-error-g" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#27F2FF" />
                <stop offset="1" stopColor="#B16DFF" />
              </linearGradient>
            </defs>
            <circle cx="32" cy="32" r="19.5" fill="none" stroke="url(#atp-error-g)" strokeWidth="2.5" />
            <path d="M32 19.5 L36 32 L32 44.5 L28 32 Z" fill="url(#atp-error-g)" />
          </svg>
        </div>

        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Something went wrong
        </h1>
        <p
          style={{
            fontSize: '0.8125rem',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.6,
            marginBottom: '1.5rem',
          }}
        >
          This page hit an unexpected error. Your saved trips are safe on this
          device — try again, or head back to the home page.
        </p>

        <div style={{ display: 'flex', gap: '0.625rem', justifyContent: 'center' }}>
          <button onClick={() => reset()} className="btn-primary">
            Try again
          </button>
          <Link href="/" className="btn-secondary">
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
}
