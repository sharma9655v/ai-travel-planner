'use client';

// Client-only Leaflet building blocks (load via next/dynamic with ssr:false —
// this module imports 'leaflet', which must never execute on the server).

import { useEffect, useMemo, type ReactNode } from 'react';
import L from 'leaflet';
import { Marker, Pane, Polyline, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import type { LucideIcon } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';

/* ──────────────────────────────────────────────────────────
   Glass overlay pane — dark translucent gradient above tiles,
   below markers/routes. z-index 350 sits between tile (200)
   and marker (600) panes.
   ────────────────────────────────────────────────────────── */

export function GlassOverlay() {
  return (
    <Pane name="glass-overlay" style={{ zIndex: 350 }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: [
            'radial-gradient(120% 90% at 50% 0%, rgba(39, 242, 255, 0.07), transparent 55%)',
            'radial-gradient(150% 110% at 85% 110%, rgba(177, 109, 255, 0.08), transparent 60%)',
            'linear-gradient(180deg, rgba(9, 11, 16, 0.55), rgba(9, 11, 16, 0.1) 45%, rgba(9, 11, 16, 0.45))',
          ].join(', ') as string,
          backdropFilter: 'blur(1.5px)',
          WebkitBackdropFilter: 'blur(1.5px)',
        }}
      />
    </Pane>
  );
}

/* ──────────────────────────────────────────────────────────
   Route polyline — per-segment interpolated cyan→purple
   gradient with a soft glow band and animated dash flow.
   ────────────────────────────────────────────────────────── */

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [
    parseInt(v.slice(0, 2), 16),
    parseInt(v.slice(2, 4), 16),
    parseInt(v.slice(4, 6), 16),
  ];
}

function mixHex(a: string, b: string, t: number): string {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  const c = ca.map((x, i) => Math.round(x + (cb[i] - x) * t));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

export function RouteGradient({
  positions,
  from = '#27F2FF',
  to = '#B16DFF',
  weight = 3.5,
  glowWeight = 11,
}: {
  positions: [number, number][];
  from?: string;
  to?: string;
  weight?: number;
  glowWeight?: number;
}) {
  const segments = useMemo(() => {
    const out: { from: [number, number]; to: [number, number]; color: string }[] = [];
    for (let i = 0; i < positions.length - 1; i++) {
      const t = positions.length <= 1 ? 0.5 : i / (positions.length - 2);
      out.push({ from: positions[i], to: positions[i + 1], color: mixHex(from, to, t) });
    }
    return out;
  }, [positions, from, to]);

  if (segments.length === 0) return null;

  return (
    <>
      {segments.map((s, i) => (
        <Polyline
          key={`glow-${i}`}
          positions={[s.from, s.to]}
          interactive={false}
          pathOptions={{
            color: s.color,
            weight: glowWeight,
            opacity: 0.13,
            lineCap: 'round',
            className: 'gm-route-glow',
          }}
        />
      ))}
      {segments.map((s, i) => (
        <Polyline
          key={`line-${i}`}
          positions={[s.from, s.to]}
          interactive={false}
          pathOptions={{
            color: s.color,
            weight,
            opacity: 0.95,
            lineCap: 'round',
            lineJoin: 'round',
            dashArray: '12 10',
            className: 'gm-route',
          }}
        />
      ))}
    </>
  );
}

/* ──────────────────────────────────────────────────────────
   Glowing destination marker — ripple ring + neon core,
   with a glass popup.
   ────────────────────────────────────────────────────────── */

export function GlowMarker({
  position,
  color = '#27F2FF',
  label,
  sublabel,
  category,
  icon: Icon,
}: {
  position: [number, number];
  color?: string;
  label: string;
  sublabel?: string;
  category?: string;
  icon?: LucideIcon;
}) {
  const divIcon = useMemo(
    () =>
      L.divIcon({
        html: `<span class="gm-marker" style="--gm-color:${color}"><span class="gm-marker-ring"></span><span class="gm-marker-ring d2"></span><span class="gm-marker-core"></span></span>`,
        className: 'gm-marker-wrap',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
        tooltipAnchor: [0, -14],
      }),
    [color]
  );

  return (
    <Marker position={position} icon={divIcon}>
      <Popup className="gm-popup" closeButton={false}>
        <div className="gm-popup-inner">
          <div
            className="gm-popup-icon"
            style={{ background: `linear-gradient(135deg, ${color}, ${color}88)`, boxShadow: `0 0 14px ${color}66` }}
          >
            {Icon ? <Icon size={16} /> : <span className="gm-popup-dot" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />}
          </div>
          <div className="gm-popup-body">
            {category && <div className="gm-popup-cat" style={{ color }}>{category}</div>}
            <div className="gm-popup-title">{label}</div>
            {sublabel && <div className="gm-popup-sub">{sublabel}</div>}
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

/* ──────────────────────────────────────────────────────────
   Current-location marker — breathing neon dot + pulse rings.
   ────────────────────────────────────────────────────────── */

export function UserPulseMarker({ position }: { position: [number, number] }) {
  const divIcon = useMemo(
    () =>
      L.divIcon({
        html: '<span class="gm-user"><i class="gm-user-pulse"></i><i class="gm-user-pulse d2"></i><b class="gm-user-dot"></b></span>',
        className: 'gm-user-wrap',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      }),
    []
  );

  return (
    <Marker position={position} icon={divIcon} zIndexOffset={1000}>
      <Popup className="gm-popup" closeButton={false}>
        <div className="gm-popup-inner">
          <div className="gm-popup-icon" style={{ background: 'linear-gradient(135deg, #27F2FF, #00C8D6)', boxShadow: '0 0 14px rgba(39,242,255,0.4)' }}>
            <span className="gm-popup-dot" style={{ background: '#27F2FF', boxShadow: '0 0 8px #27F2FF' }} />
          </div>
          <div className="gm-popup-body">
            <div className="gm-popup-cat" style={{ color: '#27F2FF' }}>LIVE</div>
            <div className="gm-popup-title">Current location</div>
            <div className="gm-popup-sub">Position locked</div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

/* ──────────────────────────────────────────────────────────
   Fly-to helper — smoothly animates the map to a new center
   when the `position` prop changes. Leaflet's MapContainer
   only reads `center` on initial mount; this component
   bridges React state → Leaflet imperative API.
   ────────────────────────────────────────────────────────── */

export function FlyToCenter({
  position,
  zoom,
}: {
  position: [number, number];
  zoom?: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.flyTo(position, zoom ?? map.getZoom(), { duration: 1.2 });
    }
  }, [map, position, zoom]);

  return null;
}

/* ──────────────────────────────────────────────────────────
   Glass marker clustering — translucent blur chips with a
   rotating dashed halo and count badge.
   ────────────────────────────────────────────────────────── */

export function ClusterLayer({ children }: { children: ReactNode }) {
  const createClusterIcon = useMemo(
    () =>
      (cluster: L.MarkerCluster) => {
        const count = cluster.getChildCount();
        return L.divIcon({
          html: `<span class="gm-cluster">${count}</span>`,
          className: 'gm-cluster-wrap',
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });
      },
    []
  );

  return (
    <MarkerClusterGroup
      chunkedLoading
      maxClusterRadius={60}
      spiderfyOnMaxZoom={false}
      showCoverageOnHover={false}
      iconCreateFunction={createClusterIcon}
    >
      {children}
    </MarkerClusterGroup>
  );
}
