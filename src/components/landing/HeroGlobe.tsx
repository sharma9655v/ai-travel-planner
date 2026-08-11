'use client';

import { useEffect, useRef } from 'react';

// ============================================================
// HeroGlobe — lightweight Canvas2D "data globe"
// Dot-field sphere + graticule + glowing destination markers
// (Goa, Jaipur, Manali, Dubai, Bali) + animated route arcs.
// Zero WebGL dependencies: dots are drawn on a 2D canvas with
// an orthographic projection, at DPR-capped resolution.
//
// Performance strategy:
//  - rAF loop pauses when the section is off-screen
//    (IntersectionObserver) and stops entirely when the tab
//    is hidden (browser throttles rAF automatically).
//  - `prefers-reduced-motion` and small screens (<640px) get a
//    static render — no animation loop at all.
//  - Device-pixel-ratio is capped at 2.
// ============================================================

type Marker = {
  name: string;
  lat: number;
  lon: number;
  color: string;
};

const MARKERS: Marker[] = [
  { name: 'Goa', lat: 15.49, lon: 73.82, color: '#27F2FF' },
  { name: 'Jaipur', lat: 26.91, lon: 75.79, color: '#27F2FF' },
  { name: 'Manali', lat: 32.24, lon: 77.19, color: '#B16DFF' },
  { name: 'Dubai', lat: 25.2, lon: 55.27, color: '#B16DFF' },
  { name: 'Bali', lat: -8.41, lon: 115.19, color: '#3DDC84' },
];

type Arc = { from: Marker; to: Marker };

const ARCS: Arc[] = [
  { from: MARKERS[0], to: MARKERS[3] },
  { from: MARKERS[1], to: MARKERS[3] },
  { from: MARKERS[2], to: MARKERS[4] },
];

const DOT_COUNT = 650;
const TILT = -0.42;
const BASE_ROT = 1.1;
const ROT_SPEED = 0.0014;

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const NARROW_QUERY = '(max-width: 640px)';

function toVec(latDeg: number, lonDeg: number): [number, number, number] {
  const lat = (latDeg * Math.PI) / 180;
  const lon = (lonDeg * Math.PI) / 180;
  return [Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon)];
}

// Rotate around Y axis, then tilt around X axis; returns screen
// projection plus depth (used for visibility fading).
function project(
  v: [number, number, number],
  rot: number,
  radius: number,
  cx: number,
  cy: number
): { x: number; y: number; depth: number } {
  const [x, y, z] = v;
  const cosR = Math.cos(rot);
  const sinR = Math.sin(rot);
  const x1 = x * cosR + z * sinR;
  const z1 = -x * sinR + z * cosR;
  const cosT = Math.cos(TILT);
  const sinT = Math.sin(TILT);
  const y2 = y * cosT - z1 * sinT;
  const z2 = y * sinT + z1 * cosT;
  return { x: cx + x1 * radius, y: cy - y2 * radius, depth: z2 };
}

// Great-circle interpolation of two unit vectors.
function slerp(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  const dot = Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
  const theta = Math.acos(dot);
  if (theta < 1e-6) return a;
  const sinT = Math.sin(theta);
  const wa = Math.sin((1 - t) * theta) / sinT;
  const wb = Math.sin(t * theta) / sinT;
  return [a[0] * wa + b[0] * wb, a[1] * wa + b[1] * wb, a[2] * wa + b[2] * wb];
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// Fibonacci sphere for a uniform dot field.
function fibonacciPoints(count: number): [number, number, number][] {
  const points: [number, number, number][] = [];
  const phi = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = phi * i;
    points.push([Math.cos(theta) * r, y, Math.sin(theta) * r]);
  }
  return points;
}

type View = {
  radius: number;
  cx: number;
  cy: number;
  dpr: number;
  width: number;
  height: number;
};

function drawStatic(
  ctx: CanvasRenderingContext2D,
  view: View,
  rot: number,
  now: number,
  withLabels: boolean
): void {
  const { radius, cx, cy } = view;
  const points = fibonacciPoints(DOT_COUNT);

  ctx.clearRect(0, 0, view.width, view.height);

  // ── Rim glow ──
  const rim = ctx.createRadialGradient(cx, cy, radius * 0.88, cx, cy, radius * 1.04);
  rim.addColorStop(0, 'rgba(39, 242, 255, 0)');
  rim.addColorStop(0.7, 'rgba(39, 242, 255, 0.09)');
  rim.addColorStop(1, 'rgba(39, 242, 255, 0)');
  ctx.fillStyle = rim;
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 1.04, 0, Math.PI * 2);
  ctx.fill();

  // ── Graticule (latitudes + meridians) ──
  ctx.strokeStyle = 'rgba(39, 242, 255, 0.07)';
  ctx.lineWidth = 1;
  for (const latDeg of [-45, 0, 45]) {
    ctx.beginPath();
    for (let t = 0; t <= 48; t++) {
      const lonDeg = (t / 48) * 360;
      const p = project(toVec(latDeg, lonDeg), rot, radius, cx, cy);
      if (t === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
  }
  for (const lonDeg of [0, 60, 120, 180, 240, 300]) {
    ctx.beginPath();
    for (let t = 0; t <= 48; t++) {
      const latDeg = lerp(-90, 90, t / 48);
      const p = project(toVec(latDeg, lonDeg), rot, radius, cx, cy);
      if (t === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
  }

  // ── Dot field ──
  ctx.fillStyle = 'rgba(140, 190, 210, 0.6)';
  for (const v of points) {
    const p = project(v, rot, radius, cx, cy);
    if (p.depth < -0.12) continue;
    const a = 0.06 + Math.max(0, p.depth) * 0.5;
    ctx.globalAlpha = a;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 1.1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // ── Route arcs ──
  const slow = Math.floor(now / 6000);
  const pulse = (now + slow * 3000) % 3000;
  const tPulse = (pulse / 3000) * 360;
  for (const arc of ARCS) {
    const a = toVec(arc.from.lat, arc.from.lon);
    const b = toVec(arc.to.lat, arc.to.lon);
    ctx.beginPath();
    let started = false;
    for (let t = 0; t <= 40; t++) {
      const dir = slerp(a, b, t / 40);
      const lift = 1 + 0.12 * Math.sin(Math.PI * (t / 40));
      const p = project(
        [dir[0] * lift, dir[1] * lift, dir[2] * lift],
        rot,
        radius,
        cx,
        cy
      );
      if (!started) {
        ctx.moveTo(p.x, p.y);
        started = true;
      } else {
        ctx.lineTo(p.x, p.y);
      }
    }
    ctx.strokeStyle = 'rgba(39, 242, 255, 0.28)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Traveling spark on the arc.
    const dir = slerp(a, b, tPulse / 360);
    const lift = 1 + 0.12 * Math.sin(Math.PI * (tPulse / 360));
    const spark = project([dir[0] * lift, dir[1] * lift, dir[2] * lift], rot, radius, cx, cy);
    ctx.fillStyle = arc.from.color;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(spark.x, spark.y, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // ── Markers ──
  for (const m of MARKERS) {
    const p = project(toVec(m.lat, m.lon), rot, radius, cx, cy);
    if (p.depth <= 0) continue;

    // Pulse ring.
    const ringR = 5 + ((now / 900) % 1) * 14;
    ctx.strokeStyle = m.color;
    ctx.globalAlpha = Math.max(0, 1 - (ringR - 5) / 14) * 0.5;
    ctx.beginPath();
    ctx.arc(p.x, p.y, ringR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Glow halos.
    const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 12);
    glow.addColorStop(0, m.color);
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Core dot.
    ctx.fillStyle = m.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
    ctx.fill();

    // Label on larger viewports only.
    if (withLabels) {
      ctx.font = '600 11px var(--font-inter), Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillText(m.name.toUpperCase(), p.x, p.y + 18);
    }
  }
}

export default function HeroGlobe() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia(REDUCED_MOTION_QUERY);
    const narrow = window.matchMedia(NARROW_QUERY);
    const staticView = reduced.matches || narrow.matches;

    const SIZE = 480;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    const view: View = {
      radius: SIZE * 0.42,
      cx: SIZE / 2,
      cy: SIZE / 2,
      dpr,
      width: SIZE,
      height: SIZE,
    };
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const withLabels = !narrow.matches;

    const draw = (rot: number, now: number) =>
      drawStatic(ctx, view, rot, now, withLabels);

    if (staticView) {
      draw(BASE_ROT, 6000);
      return;
    }

    let raf = 0;
    let visible = true;
    let rot = BASE_ROT;

    const observer = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? true;
      if (visible) raf = requestAnimationFrame(loop);
      else cancelAnimationFrame(raf);
    });
    observer.observe(canvas);

    function loop(t: number) {
      if (!visible) return;
      rot += ROT_SPEED;
      draw(rot, t);
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label="Animated globe highlighting Goa, Jaipur, Manali, Dubai and Bali with AI-planned route arcs"
      style={{
        display: 'block',
        width: 'min(480px, 82vw)',
        height: 'min(480px, 82vw)',
        maxWidth: '100%',
      }}
    />
  );
}