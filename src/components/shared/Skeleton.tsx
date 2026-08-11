import type { CSSProperties } from 'react';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  card?: boolean;
  circle?: boolean;
  className?: string;
  style?: CSSProperties;
}

// Shimmer placeholder for loading states. Renders nothing interactive.
export default function Skeleton({
  width = '100%',
  height = 14,
  radius,
  card = false,
  circle = false,
  className = '',
  style,
}: SkeletonProps) {
  const classes = ['skeleton', card ? 'skeleton-card' : '', circle ? 'skeleton-circle' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      aria-hidden="true"
      className={classes}
      style={{ width, height, borderRadius: radius, ...style }}
    />
  );
}
