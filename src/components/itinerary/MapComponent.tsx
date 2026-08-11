'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Map } from 'lucide-react';
import { DayPlan, Accommodation, Restaurant, HiddenGem } from '@/types/itinerary';
import { useMounted } from '@/hooks/useMounted';

const MapContainer = dynamic(() => import('react-leaflet').then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((m) => m.TileLayer), { ssr: false });
const GlassOverlay = dynamic(() => import('@/components/map/MapLayer').then((m) => m.GlassOverlay), { ssr: false });
const RouteGradient = dynamic(() => import('@/components/map/MapLayer').then((m) => m.RouteGradient), { ssr: false });
const GlowMarker = dynamic(() => import('@/components/map/MapLayer').then((m) => m.GlowMarker), { ssr: false });
const UserPulseMarker = dynamic(() => import('@/components/map/MapLayer').then((m) => m.UserPulseMarker), { ssr: false });

interface MapComponentProps {
  dailyItinerary: DayPlan[];
  accommodations: Accommodation[];
  restaurants: Restaurant[];
  hiddenGems: HiddenGem[];
}

interface PointMarker {
  pos: [number, number];
  label: string;
  sublabel?: string;
}

export default function MapComponent({
  dailyItinerary,
  accommodations,
  restaurants,
  hiddenGems,
}: MapComponentProps) {
  const mounted = useMounted();

  // Current user location from browser Geolocation API
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [geoReady, setGeoReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGeoReady(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        setGeoReady(true);
      },
      () => {
        // Permission denied or error — fall back to destination coords
        setGeoReady(true);
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 300_000 }
    );
  }, []);

  // Gather all coordinates from the itinerary
  const allCoords: [number, number][] = [];
  dailyItinerary?.forEach((day) =>
    day.activities?.forEach((act) => {
      if (act.latitude && act.longitude) allCoords.push([act.latitude, act.longitude]);
    })
  );
  accommodations?.forEach((acc) => {
    if (acc.latitude && acc.longitude) allCoords.push([acc.latitude, acc.longitude]);
  });

  if (allCoords.length === 0) return null;

  // Fallback center: first itinerary coordinate
  const fallbackCenter = allCoords[0];

  // Use current location as center if available, otherwise use destination
  const center: [number, number] = userLocation || fallbackCenter;

  // Route path from activities
  const routePath: [number, number][] = [];
  dailyItinerary?.forEach((day) =>
    day.activities?.forEach((act) => {
      if (act.latitude && act.longitude) routePath.push([act.latitude, act.longitude]);
    })
  );

  const activityMarkers: PointMarker[] = [];
  dailyItinerary?.forEach((day) =>
    day.activities?.forEach((act) => {
      if (act.latitude && act.longitude)
        activityMarkers.push({ pos: [act.latitude, act.longitude], label: act.name, sublabel: act.location });
    })
  );

  const accommodationMarkers: PointMarker[] = (accommodations ?? [])
    .filter((acc) => acc.latitude && acc.longitude)
    .map((acc) => ({ pos: [acc.latitude, acc.longitude], label: acc.name, sublabel: acc.location }));

  const restaurantMarkers: PointMarker[] = (restaurants ?? [])
    .filter((r) => r.latitude && r.longitude)
    .map((r) => ({ pos: [r.latitude, r.longitude], label: r.name, sublabel: r.cuisine }));

  const hiddenGemMarkers: PointMarker[] = (hiddenGems ?? [])
    .filter((g) => g.latitude && g.longitude)
    .map((g) => ({ pos: [g.latitude, g.longitude], label: g.name, sublabel: g.location }));

  if (!mounted || !geoReady) {
    return (
      <div
        className="glass-card-static"
        style={{
          height: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '2rem',
        }}
      >
        <Map size={24} color="var(--color-text-muted)" />
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '2rem' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1rem',
        }}
      >
        <div
          style={{
            width: 4,
            height: 20,
            borderRadius: 2,
            background: 'linear-gradient(180deg, #27F2FF, #B16DFF)',
          }}
        />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Route Map</h2>
      </div>

      <div
        className="glass-card-static"
        style={{
          overflow: 'hidden',
          borderRadius: 'var(--radius-xl)',
          height: 350,
        }}
      >
        <MapContainer
          center={center}
          zoom={userLocation ? 5 : 13}
          className="gm-glass-map"
          style={{ width: '100%', height: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          <GlassOverlay />

          {/* Animated gradient route line */}
          {routePath.length > 1 && <RouteGradient positions={routePath} />}

          {/* Pulsing marker at user's real current location */}
          {userLocation && <UserPulseMarker position={userLocation} />}

          {/* Glowing destination markers */}
          {activityMarkers.map((m, i) => (
            <GlowMarker
              key={`act-${i}`}
              position={m.pos}
              color="#27F2FF"
              label={m.label}
              sublabel={m.sublabel}
              category="Activity"
            />
          ))}
          {accommodationMarkers.map((m, i) => (
            <GlowMarker
              key={`acc-${i}`}
              position={m.pos}
              color="#B16DFF"
              label={m.label}
              sublabel={m.sublabel}
              category="Stay"
            />
          ))}
          {restaurantMarkers.map((m, i) => (
            <GlowMarker
              key={`rst-${i}`}
              position={m.pos}
              color="#FFB547"
              label={m.label}
              sublabel={m.sublabel}
              category="Dining"
            />
          ))}
          {hiddenGemMarkers.map((m, i) => (
            <GlowMarker
              key={`gem-${i}`}
              position={m.pos}
              color="#3DDC84"
              label={m.label}
              sublabel={m.sublabel}
              category="Hidden gem"
            />
          ))}
        </MapContainer>
      </div>
    </div>
  );
}