'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
  Navigation2,
  Minus,
  Plus,
  MapPin,
  Hotel,
  UtensilsCrossed,
  Zap,
  Fuel,
  Car,
  CloudRain,
  Activity,
  Wand2,
  LocateFixed,
  Loader2,
} from 'lucide-react';
import Navbar from '@/components/shared/Navbar';
import BottomNav from '@/components/shared/BottomNav';
import { useMounted } from '@/hooks/useMounted';
import { useItinerariesStore } from '@/hooks/useItineraries';

// Dynamic import for Leaflet (SSR-safe)
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const GlassOverlay = dynamic(
  () => import('@/components/map/MapLayer').then((mod) => mod.GlassOverlay),
  { ssr: false }
);
const RouteGradient = dynamic(
  () => import('@/components/map/MapLayer').then((mod) => mod.RouteGradient),
  { ssr: false }
);
const GlowMarker = dynamic(
  () => import('@/components/map/MapLayer').then((mod) => mod.GlowMarker),
  { ssr: false }
);
const UserPulseMarker = dynamic(
  () => import('@/components/map/MapLayer').then((mod) => mod.UserPulseMarker),
  { ssr: false }
);
const ClusterLayer = dynamic(
  () => import('@/components/map/MapLayer').then((mod) => mod.ClusterLayer),
  { ssr: false }
);

export default function MapPage() {
  const mounted = useMounted();
  const [activeOverlays, setActiveOverlays] = useState<string[]>(['attractions', 'hotels', 'restaurants']);
  const [notice, setNotice] = useState<string | null>(null);

  // Real-time user location from browser Geolocation API
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [geoReady, setGeoReady] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);

  // Get the most recent saved trip for POI data
  const plans = useItinerariesStore((s) => s.plans);
  const latestPlan = Object.values(plans).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0];
  const itinerary = latestPlan?.itinerary;
  const tripName = itinerary?.tripSummary?.destination || 'Your Location';

  // Start watching geolocation on mount
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGeoReady(true);
      return;
    }

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos([pos.coords.latitude, pos.coords.longitude]);
        setGeoReady(true);
      },
      () => {
        // Fallback: use first activity coordinate from saved trip, or a world-center default
        if (itinerary?.dailyItinerary?.[0]?.activities?.[0]) {
          const act = itinerary.dailyItinerary[0].activities[0];
          if (act.latitude && act.longitude) {
            setUserPos([act.latitude, act.longitude]);
          }
        }
        setGeoReady(true);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 }
    );

    // Watch for real-time position updates
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setUserPos([pos.coords.latitude, pos.coords.longitude]);
      },
      () => { /* ignore watch errors */ },
      { enableHighAccuracy: true, maximumAge: 10_000 }
    );
    setWatchId(id);

    return () => {
      navigator.geolocation.clearWatch(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recenter button handler
  const handleRecenter = useCallback(() => {
    if (!navigator.geolocation) {
      setNotice('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos([pos.coords.latitude, pos.coords.longitude]);
        setNotice('Centered on your current location.');
        setTimeout(() => setNotice(null), 2000);
      },
      () => {
        setNotice('Unable to get your location. Check browser permissions.');
        setTimeout(() => setNotice(null), 3000);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, []);

  // Build POI lists from saved trip data
  const poiList: {
    type: string;
    name: string;
    pos: [number, number];
    color: string;
    icon: LucideIcon;
    sublabel?: string;
  }[] = [];

  // Activities from the itinerary
  itinerary?.dailyItinerary?.forEach((day) =>
    day.activities?.forEach((act) => {
      if (act.latitude && act.longitude) {
        poiList.push({
          type: 'attractions',
          name: act.name,
          pos: [act.latitude, act.longitude],
          color: '#27F2FF',
          icon: MapPin,
          sublabel: act.location,
        });
      }
    })
  );

  // Accommodations
  itinerary?.accommodations?.forEach((acc) => {
    if (acc.latitude && acc.longitude) {
      poiList.push({
        type: 'hotels',
        name: acc.name,
        pos: [acc.latitude, acc.longitude],
        color: '#B16DFF',
        icon: Hotel,
        sublabel: acc.location,
      });
    }
  });

  // Restaurants
  itinerary?.restaurants?.forEach((r) => {
    if (r.latitude && r.longitude) {
      poiList.push({
        type: 'restaurants',
        name: r.name,
        pos: [r.latitude, r.longitude],
        color: '#FFB547',
        icon: UtensilsCrossed,
        sublabel: r.cuisine,
      });
    }
  });

  // Hidden gems
  itinerary?.hiddenGems?.forEach((g) => {
    if (g.latitude && g.longitude) {
      poiList.push({
        type: 'attractions',
        name: g.name,
        pos: [g.latitude, g.longitude],
        color: '#3DDC84',
        icon: Zap,
        sublabel: g.category,
      });
    }
  });

  // Route path from activities
  const routePath: [number, number][] = [];
  itinerary?.dailyItinerary?.forEach((day) =>
    day.activities?.forEach((act) => {
      if (act.latitude && act.longitude) routePath.push([act.latitude, act.longitude]);
    })
  );

  // Count POIs per category
  const countByType = (type: string) => poiList.filter((p) => p.type === type).length;

  const mapOverlayConfig = [
    { id: 'attractions', icon: MapPin, label: 'Attractions', color: '#27F2FF', count: countByType('attractions') },
    { id: 'hotels', icon: Hotel, label: 'Hotels', color: '#B16DFF', count: countByType('hotels') },
    { id: 'restaurants', icon: UtensilsCrossed, label: 'Restaurants', color: '#FFB547', count: countByType('restaurants') },
  ];

  const toggleOverlay = (id: string) => {
    setActiveOverlays((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Default center: user location, fallback to first POI, fallback to world center
  const center: [number, number] = userPos || (poiList[0]?.pos ?? [20, 0]);

  // Don't render map until geolocation resolves
  const mapReady = mounted && geoReady;

  return (
    <main style={{ minHeight: '100vh', position: 'relative' }}>
      <Navbar />

      {/* Full-screen Map */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        {mapReady ? (
          <MapContainer
            center={center}
            zoom={userPos ? 14 : 10}
            className="gm-glass-map"
            style={{ width: '100%', height: '100%' }}
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            {/* Dark translucent glass overlay */}
            <GlassOverlay />

            {/* Animated gradient route line */}
            {routePath.length > 1 && <RouteGradient positions={routePath} />}

            {/* Current position glowing pulse — real GPS */}
            {userPos && <UserPulseMarker position={userPos} />}

            {/* Glass-clustered glowing POI markers */}
            <ClusterLayer>
              {poiList.map((poi, idx) => {
                if (!activeOverlays.includes(poi.type)) return null;
                const overlay = mapOverlayConfig.find((o) => o.id === poi.type);
                return (
                  <GlowMarker
                    key={idx}
                    position={poi.pos}
                    color={poi.color}
                    label={poi.name}
                    category={overlay?.label}
                    sublabel={poi.sublabel}
                    icon={poi.icon}
                  />
                );
              })}
            </ClusterLayer>
          </MapContainer>
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'var(--color-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <Loader2 size={32} color="#27F2FF" className="animate-spin" />
            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
              Getting your location...
            </span>
          </div>
        )}
      </div>

      {/* Map HUD Overlay Controls */}
      <div style={{ position: 'relative', zIndex: 10, paddingTop: '70px' }}>
        {/* Top HUD Controls */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0 1rem',
            marginBottom: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          {/* Route Status Tag — shows real trip name */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 1rem',
              background: 'rgba(15, 17, 24, 0.88)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(39, 242, 255, 0.3)',
              borderRadius: 'var(--radius-full)',
              boxShadow: '0 0 20px rgba(39, 242, 255, 0.15)',
            }}
          >
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#27F2FF', boxShadow: '0 0 8px #27F2FF' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#27F2FF' }}>
              {tripName} {itinerary ? '— Route' : '— Live'}
            </span>
          </div>

          {/* Traffic Toggle */}
          <button
            onClick={() => { setNotice('Live traffic layer coming soon.'); setTimeout(() => setNotice(null), 2000); }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.4rem 0.875rem',
              background: 'rgba(15, 17, 24, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 'var(--radius-full)',
              color: 'var(--color-text-muted)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              backdropFilter: 'blur(20px)',
            }}
          >
            <Activity size={12} />
            <span>Traffic</span>
          </button>

          {/* Weather Toggle */}
          <button
            onClick={() => { setNotice('Live weather overlay coming soon.'); setTimeout(() => setNotice(null), 2000); }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.4rem 0.875rem',
              background: 'rgba(15, 17, 24, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 'var(--radius-full)',
              color: 'var(--color-text-muted)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              backdropFilter: 'blur(20px)',
            }}
          >
            <CloudRain size={12} />
            <span>Weather</span>
          </button>

          {/* Optimize */}
          <button
            onClick={() => { setNotice('Route optimization coming soon.'); setTimeout(() => setNotice(null), 2000); }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.4rem 0.875rem',
              background: 'rgba(15, 17, 24, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 'var(--radius-full)',
              color: 'var(--color-text-muted)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              backdropFilter: 'blur(20px)',
            }}
          >
            <Wand2 size={12} />
            <span>Optimize</span>
          </button>
        </motion.div>

        {/* Floating Right HUD Tool Bar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{
            position: 'fixed',
            right: '1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            zIndex: 25,
          }}
        >
          {/* Zoom */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              background: 'rgba(15, 17, 24, 0.88)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
            }}
          >
            <button
              onClick={() => { setNotice('Use pinch/scroll to zoom the map.'); setTimeout(() => setNotice(null), 2000); }}
              style={{
                width: 42,
                height: 42,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                color: '#FFF',
                cursor: 'pointer',
              }}
            >
              <Plus size={16} />
            </button>
            <button
              onClick={() => { setNotice('Use pinch/scroll to zoom the map.'); setTimeout(() => setNotice(null), 2000); }}
              style={{
                width: 42,
                height: 42,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 'none',
                color: '#FFF',
                cursor: 'pointer',
              }}
            >
              <Minus size={16} />
            </button>
          </div>

          {/* Recenter on current location */}
          <button
            onClick={handleRecenter}
            style={{
              width: 42,
              height: 42,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(15, 17, 24, 0.88)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 'var(--radius-lg)',
              color: '#27F2FF',
              cursor: 'pointer',
            }}
          >
            <LocateFixed size={18} />
          </button>

          {/* Navigation */}
          <button
            onClick={() => { setNotice('Turn-by-turn navigation coming soon.'); setTimeout(() => setNotice(null), 2000); }}
            style={{
              width: 42,
              height: 42,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(15, 17, 24, 0.88)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 'var(--radius-lg)',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
            }}
          >
            <Navigation2 size={18} />
          </button>
        </motion.div>

        {notice && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              position: 'fixed',
              left: '50%',
              transform: 'translateX(-50%)',
              bottom: '7rem',
              padding: '0.5rem 0.875rem',
              background: 'rgba(15, 17, 24, 0.92)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 'var(--radius-lg)',
              fontSize: '0.75rem',
              color: 'var(--color-text-secondary)',
              zIndex: 30,
              whiteSpace: 'nowrap',
            }}
          >
            {notice}
          </motion.div>
        )}

        {/* Bottom Category Filter Overlay Slider */}
        <div
          style={{
            position: 'fixed',
            bottom: '5.25rem',
            left: 0,
            right: 0,
            padding: '0 1rem',
            zIndex: 20,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'flex',
              gap: '0.5rem',
              overflowX: 'auto',
              scrollbarWidth: 'none',
              paddingBottom: '0.5rem',
            }}
          >
            {mapOverlayConfig.map((overlay) => {
              const active = activeOverlays.includes(overlay.id);
              const Icon = overlay.icon;
              return (
                <motion.button
                  key={overlay.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleOverlay(overlay.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 0.875rem',
                    background: active ? `${overlay.color}20` : 'rgba(15, 17, 24, 0.88)',
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${active ? overlay.color : 'rgba(255, 255, 255, 0.08)'}`,
                    borderRadius: 'var(--radius-full)',
                    color: active ? '#FFF' : 'var(--color-text-muted)',
                    cursor: 'pointer',
                    flexShrink: 0,
                    fontFamily: 'inherit',
                    transition: 'all 200ms',
                  }}
                >
                  <Icon size={14} color={overlay.color} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {overlay.label}
                  </span>
                  <span
                    style={{
                      fontSize: '0.625rem',
                      fontWeight: 700,
                      color: overlay.color,
                      background: `${overlay.color}20`,
                      padding: '0.1rem 0.375rem',
                      borderRadius: 'var(--radius-full)',
                    }}
                  >
                    {overlay.count}
                  </span>
                </motion.button>
              );
            })}
          </motion.div>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
