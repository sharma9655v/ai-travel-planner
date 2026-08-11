import type { TripSummary } from '@/types/itinerary';
import { formatDate } from '@/lib/utils';

interface ReportCoverProps {
  summary: TripSummary;
  activitiesCount: number;
  accommodationsCount: number;
  restaurantsCount: number;
  currency: string;
}

// Cover page — breaks to a fresh page when printed.
export default function ReportCover({
  summary,
  activitiesCount,
  accommodationsCount,
  restaurantsCount,
  currency,
}: ReportCoverProps) {
  const generatedOn = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const chips = [
    summary.travelStyle,
    currency,
    `${summary.totalDays} days`,
    `${activitiesCount} activities`,
    accommodationsCount > 0 ? `${accommodationsCount} stays` : null,
    restaurantsCount > 0 ? `${restaurantsCount} restaurants` : null,
  ].filter(Boolean) as string[];

  return (
    <div
      className="report-cover"
      style={{
        position: 'relative',
        minHeight: '88vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '6rem 1.5rem 4rem',
        overflow: 'hidden',
      }}
    >
      {/* Decorative glows (screen only) */}
      <div
        className="no-print"
        style={{
          position: 'absolute',
          top: '12%',
          left: '10%',
          width: 260,
          height: 260,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(39, 242, 255, 0.14), transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        className="no-print"
        style={{
          position: 'absolute',
          bottom: '10%',
          right: '8%',
          width: 320,
          height: 320,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(177, 109, 255, 0.16), transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          fontSize: '0.6875rem',
          fontWeight: 800,
          letterSpacing: '0.32em',
          textTransform: 'uppercase',
          color: 'var(--color-primary)',
          marginBottom: '1.5rem',
        }}
      >
        AI-Generated Travel Report
      </div>

      <h1
        style={{
          fontSize: 'clamp(2.4rem, 8vw, 4.2rem)',
          fontWeight: 900,
          letterSpacing: '-0.03em',
          lineHeight: 1.05,
          margin: 0,
          backgroundImage: 'linear-gradient(135deg, #27F2FF 0%, #B16DFF 60%, #FF6B9D 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        {summary.destination}
      </h1>

      <p
        style={{
          margin: '1rem 0 1.75rem',
          fontSize: '0.9375rem',
          color: 'var(--color-text-secondary)',
        }}
      >
        {formatDate(summary.startDate)} — {formatDate(summary.endDate)}
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', marginBottom: '2.25rem' }}>
        {chips.map((chip) => (
          <span
            key={chip}
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.09)',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
            }}
          >
            {chip}
          </span>
        ))}
      </div>

      {summary.coverDescription && (
        <p
          style={{
            maxWidth: 560,
            margin: 0,
            fontSize: '0.875rem',
            lineHeight: 1.7,
            color: 'var(--color-text-secondary)',
            fontStyle: 'italic',
          }}
        >
          {summary.coverDescription}
        </p>
      )}

      <div
        style={{
          position: 'absolute',
          bottom: '2.5rem',
          left: 0,
          right: 0,
          fontSize: '0.6875rem',
          color: 'var(--color-text-muted)',
          letterSpacing: '0.08em',
        }}
      >
        Prepared by AI Travel Planner · {generatedOn}
      </div>
    </div>
  );
}
