import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  accent?: 'cyan' | 'purple' | 'amber';
}

const ACCENTS = {
  cyan: { color: '#27F2FF', bg: 'rgba(39, 242, 255, 0.1)', border: 'rgba(39, 242, 255, 0.2)' },
  purple: { color: '#B16DFF', bg: 'rgba(177, 109, 255, 0.1)', border: 'rgba(177, 109, 255, 0.2)' },
  amber: { color: '#FFB547', bg: 'rgba(255, 181, 71, 0.1)', border: 'rgba(255, 181, 71, 0.2)' },
} as const;

// Standardized empty / idle state card.
export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  accent = 'cyan',
}: EmptyStateProps) {
  const a = ACCENTS[accent];

  return (
    <div
      className="glass-card-static"
      style={{
        padding: '3.25rem 1.5rem',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.75rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient radial glow */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '-3.5rem',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 220,
          height: 220,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${a.color}14 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />
      {Icon && (
        <div style={{ position: 'relative', width: 84, height: 84, marginBottom: '0.4rem' }}>
          {/* Dashed orbit ring */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: `1.5px dashed ${a.border}`,
            }}
          />
          {/* Gradient-ring icon orb */}
          <div
            style={{
              position: 'absolute',
              inset: 8,
              borderRadius: '50%',
              padding: 1.5,
              background: `linear-gradient(135deg, ${a.color} 0%, rgba(255,255,255,0.08) 100%)`,
              boxShadow: `0 0 26px ${a.bg}`,
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                background: 'var(--color-bg-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon size={24} color={a.color} strokeWidth={1.75} />
            </div>
          </div>
        </div>
      )}
      {title && (
        <h3 style={{ fontSize: '1.0625rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
          {title}
        </h3>
      )}
      <p
        style={{
          margin: 0,
          maxWidth: 320,
          fontSize: '0.8125rem',
          lineHeight: 1.65,
          color: 'var(--color-text-secondary)',
        }}
      >
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="btn-primary"
          style={{ marginTop: '0.5rem', fontSize: '0.8125rem', padding: '0.625rem 1.375rem' }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
