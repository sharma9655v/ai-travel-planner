'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

interface LazyMountProps {
  children: ReactNode;
  /** Distance in px from the viewport edge at which the content mounts. */
  rootMargin?: string;
  fallback?: ReactNode;
}

// Mounts children only when the element approaches the viewport (IntersectionObserver).
// Used to defer expensive chunks (e.g. the Leaflet map) until the user is about to see
// them. Falls back to immediate mount when IntersectionObserver is unavailable.
export default function LazyMount({
  children,
  rootMargin = '800px',
  fallback = null,
}: LazyMountProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === 'undefined') {
      // Fallback for old browsers — mount as soon as the effect runs, but
      // deferred a tick so it never triggers a cascading synchronous setState.
      const id = window.setTimeout(() => setVisible(true), 0);
      return () => window.clearTimeout(id);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div ref={ref} style={{ display: visible ? undefined : 'contents' }}>
      {visible ? children : fallback}
    </div>
  );
}
