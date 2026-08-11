import Link from 'next/link';
import { Compass } from 'lucide-react';
import { getSharedTrip } from '@/lib/db/shareStore';
import SharedTripView from '@/components/share/SharedTripView';
import SharedTripActions from '@/components/share/SharedTripActions';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

// Public page for a shared trip link (/share/[token]).
// Rendered server-side so it works for visitors without any app state.
export default async function SharedTripPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const record = await getSharedTrip(token);

  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-bg)', paddingBottom: '4rem' }}>
      {/* Minimal public header — no account chrome on shared pages */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.75rem 1.25rem',
          background: 'rgba(9, 11, 16, 0.85)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
        }}
      >
        <Link href="/plan" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
          <Compass size={18} color="var(--color-primary)" />
          <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
            AI Travel Planner
          </span>
        </Link>
        <div style={{ flex: 1 }} />
        <Link
          href="/plan"
          style={{
            fontSize: '0.6875rem',
            fontWeight: 700,
            color: 'var(--color-primary)',
            textDecoration: 'none',
            border: '1px solid rgba(39, 242, 255, 0.3)',
            padding: '0.4rem 0.8rem',
            borderRadius: 'var(--radius-full)',
          }}
        >
          Create your own trip
        </Link>
      </header>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1.25rem 0' }}>
        {!record ? (
          <div
            style={{
              textAlign: 'center',
              padding: '4rem 2rem',
              borderRadius: 'var(--radius-xl)',
              background: 'var(--color-card)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔗</div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
              This link is invalid or was revoked
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
              The trip may have been deleted or sharing was turned off by its creator.
            </p>
            <Link
              href="/plan"
              style={{
                textDecoration: 'none',
                fontSize: '0.8125rem',
                fontWeight: 700,
                color: '#090B10',
                background: 'linear-gradient(135deg, #27F2FF, #B16DFF)',
                padding: '0.7rem 1.4rem',
                borderRadius: 'var(--radius-full)',
              }}
            >
              Plan your own trip
            </Link>
          </div>
        ) : (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                marginBottom: '1.25rem',
                fontSize: '0.6875rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--color-text-muted)',
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-success)' }} />
              Shared trip · published {formatDate(record.createdAt)}
              {record.mode === 'edit' && <span style={{ color: 'var(--color-primary)' }}>· editable</span>}
            </div>

            <SharedTripView itinerary={record.itinerary} />

            <div style={{ marginTop: '1.5rem' }}>
              <SharedTripActions mode={record.mode} itinerary={record.itinerary} />
            </div>
          </>
        )}
      </div>
    </main>
  );
}
