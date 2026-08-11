'use client';

import { motion } from 'framer-motion';

export interface PieSegment {
  label: string;
  share: number; // 0-100
  color: string;
}

interface BudgetPieChartProps {
  segments: PieSegment[];
  centerLabel: string;
  centerValue: string;
}

const SIZE = 132;
const RADIUS = 52;
const STROKE = 17;

export default function BudgetPieChart({
  segments,
  centerLabel,
  centerValue,
}: BudgetPieChartProps) {
  const hasData = segments.some((s) => s.share > 0);
  let cumulative = 0;

  return (
    <div
      style={{
        position: 'relative',
        width: SIZE,
        height: SIZE,
        margin: '0 auto',
        flexShrink: 0,
      }}
    >
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="rgba(255, 255, 255, 0.06)"
          strokeWidth={STROKE}
        />
        {hasData
          ? segments.map((segment, i) => {
              const offset = cumulative;
              cumulative += segment.share;
              return (
                <motion.circle
                  key={`${segment.label}-${i}`}
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth={STROKE}
                  pathLength={100}
                  transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
                  initial={{ strokeDasharray: '0 100' }}
                  animate={{ strokeDasharray: `${segment.share} ${100 - segment.share}` }}
                  transition={{ duration: 0.8, delay: i * 0.06, ease: 'easeOut' }}
                  style={{
                    strokeDasharray: `${segment.share} ${100 - segment.share}`,
                    strokeDashoffset: -offset,
                  }}
                />
              );
            })
          : null}
      </svg>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '0 1.5rem',
        }}
      >
        <div
          style={{
            fontSize: '0.5625rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--color-text-muted)',
            marginBottom: '0.25rem',
          }}
        >
          {centerLabel}
        </div>
        <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
          {centerValue}
        </div>
      </div>
    </div>
  );
}
