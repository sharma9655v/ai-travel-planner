import type { ReactNode } from 'react';

interface ReportSectionProps {
  number: string;
  title: string;
  kicker?: string;
  flow?: boolean;
  children: ReactNode;
}

// Shared section shell for the Travel Report.
// `flow` = content may span multiple printed pages (daily itinerary).
export default function ReportSection({ number, title, kicker, flow = false, children }: ReportSectionProps) {
  return (
    <section
      className={flow ? 'report-section report-flow' : 'report-section'}
      style={{
        marginBottom: '1.75rem',
        padding: '1.75rem 1.5rem',
        borderRadius: 'var(--radius-xl)',
        background: 'var(--color-card)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      <header style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 30,
            height: 30,
            flexShrink: 0,
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, rgba(39, 242, 255, 0.16), rgba(177, 109, 255, 0.16))',
            border: '1px solid rgba(39, 242, 255, 0.25)',
            fontSize: '0.8125rem',
            fontWeight: 800,
            color: 'var(--color-primary)',
          }}
        >
          {number}
        </span>
        <div>
          {kicker && (
            <div style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
              {kicker}
            </div>
          )}
          <h2 style={{ fontSize: '1.0625rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
            {title}
          </h2>
        </div>
      </header>
      {children}
    </section>
  );
}
