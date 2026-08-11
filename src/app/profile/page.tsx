'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  UserRound,
  LogOut,
  Sparkles,
  Eye,
  PencilLine,
  Globe,
  Star,
  MapPin,
  History,
  Plane,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useItinerariesStore } from '@/hooks/useItineraries';
import { fetchCloudTrips, fetchTripHistory, type TripEventAction } from '@/lib/trips/cloud';
import type { SavedItinerary } from '@/types/itinerary';
import { formatDate } from '@/lib/utils';
import Navbar from '@/components/shared/Navbar';
import BottomNav from '@/components/shared/BottomNav';
import ProfileTripCard from '@/components/profile/ProfileTripCard';
import Skeleton from '@/components/shared/Skeleton';
import EmptyState from '@/components/shared/EmptyState';

type TabId = 'trips' | 'favorites' | 'history';

interface HistoryRow {
  trip_id: string;
  action: TripEventAction;
  created_at: string;
}

const ACTION_META: Record<TripEventAction, { label: string; icon: React.ElementType; color: string }> = {
  generated: { label: 'Trip generated', icon: Sparkles, color: '#B16DFF' },
  viewed: { label: 'Trip opened', icon: Eye, color: '#27F2FF' },
  edited: { label: 'Trip edited', icon: PencilLine, color: '#3DDC84' },
};

const TABS: { id: TabId; label: string }[] = [
  { id: 'trips', label: 'Saved Trips' },
  { id: 'favorites', label: 'Favorites' },
  { id: 'history', label: 'Trip History' },
];

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading: authLoading, signOut } = useAuth();

  const plans = useItinerariesStore((s) => s.plans);
  const localFavorites = useItinerariesStore((s) => s.favorites);
  const deleteItinerary = useItinerariesStore((s) => s.deleteItinerary);
  const toggleFavorite = useItinerariesStore((s) => s.toggleFavorite);

  const [tab, setTab] = useState<TabId>('trips');
  const [cloudTrips, setCloudTrips] = useState<SavedItinerary[]>([]);
  const [cloudHistory, setCloudHistory] = useState<HistoryRow[]>([]);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);

  const authed = Boolean(user);
  const userId = user?.id ?? null;

  useEffect(() => {
    if (!userId) return;
    let active = true;

    fetchCloudTrips().then((trips) => {
      if (active) {
        setCloudTrips(trips);
        setLoadedUserId(userId);
      }
    });
    fetchTripHistory().then((rows) => {
      if (active) setCloudHistory(rows as HistoryRow[]);
    });

    return () => {
      active = false;
    };
  }, [userId]);

  // Signed out → clear cloud data (adjust state during render, per React docs).
  if (!userId && loadedUserId !== null) {
    setCloudTrips([]);
    setCloudHistory([]);
    setLoadedUserId(null);
  }

  const localTrips = useMemo(
    () => Object.values(plans).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [plans]
  );

  const cloudReady = authed && loadedUserId === userId;
  const trips = authed ? (cloudReady ? cloudTrips : []) : localTrips;
  const syncing = authed && !cloudReady;
  const historyLoading = authed && !cloudReady;

  const favoritesCount = authed
    ? trips.filter((t) => t.favorite).length
    : Object.values(localFavorites).filter(Boolean).length;

  const isFavorite = (trip: SavedItinerary) =>
    authed ? Boolean(trip.favorite) : Boolean(localFavorites[trip.id]);

  const handleToggleFavorite = (id: string) => toggleFavorite(id);
  const handleDelete = (id: string) => {
    deleteItinerary(id);
    if (authed) {
      setCloudTrips((prev) => (prev ? prev.filter((t) => t.id !== id) : prev));
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (authLoading) {
    return (
      <main style={{ minHeight: '100vh', background: 'var(--color-bg)', paddingBottom: '5rem' }}>
        <Navbar />
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '70px 1.25rem 0', display: 'grid', gap: '1rem' }}>
          {/* Profile header skeleton */}
          <div
            className="glass-card-static"
            style={{ padding: '2.5rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}
            aria-hidden="true"
          >
            <Skeleton circle width={80} height={80} />
            <Skeleton width={180} height={22} radius={6} />
            <Skeleton width={240} height={12} radius={6} />
            <Skeleton width={160} height={38} radius={12} card />
          </div>
          {/* Stats skeleton */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }} aria-hidden="true">
            <Skeleton card height={104} />
            <Skeleton card height={104} />
            <Skeleton card height={104} />
          </div>
          <span className="sr-only" role="status">Loading profile…</span>
        </div>
        <BottomNav />
      </main>
    );
  }

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Traveler';
  const avatarUrl = (user?.user_metadata?.avatar_url as string | undefined) ?? null;
  const provider = (user?.app_metadata?.provider as string | undefined) ?? null;

  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-bg)', paddingBottom: '5rem' }}>
      <Navbar />

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '70px 1.25rem 0' }}>
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card-static"
          style={{
            padding: '2rem 1.5rem',
            textAlign: 'center',
            marginBottom: '1.5rem',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(135deg, rgba(39, 242, 255, 0.05), rgba(177, 109, 255, 0.05))',
              pointerEvents: 'none',
            }}
          />

          <div style={{ position: 'relative', zIndex: 1 }}>
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={displayName}
                width={80}
                height={80}
                unoptimized
                style={{
                  borderRadius: 'var(--radius-full)',
                  margin: '0 auto 1rem',
                  display: 'block',
                  border: '2px solid rgba(39, 242, 255, 0.4)',
                  boxShadow: '0 4px 20px rgba(39, 242, 255, 0.3)',
                }}
              />
            ) : (
              <motion.div
                whileHover={{ scale: 1.05 }}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 'var(--radius-full)',
                  background: 'linear-gradient(135deg, #27F2FF, #B16DFF)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  fontWeight: 800,
                  color: '#090B10',
                  margin: '0 auto 1rem',
                  boxShadow: '0 4px 20px rgba(39, 242, 255, 0.3)',
                }}
              >
                {authed ? displayName.charAt(0).toUpperCase() : <UserRound size={34} />}
              </motion.div>
            )}

            <h2 style={{ fontSize: '1.375rem', fontWeight: 800, marginBottom: '0.25rem' }}>
              {authed ? displayName : 'Guest Mode'}
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
              {authed
                ? (user?.email ?? '') +
                  (provider ? ` · ${provider.charAt(0).toUpperCase()}${provider.slice(1)}` : '')
                : 'Trips are stored on this device only.'}
            </p>

            {authed ? (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <HeaderPill icon={<Globe size={12} />} text={`Member since ${formatDate(user?.created_at ?? '')}`} />
                {provider && <HeaderPill icon={<Plane size={12} />} text={`Signed in with ${provider}`} />}
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push('/auth/login?next=/profile')}
                className="btn-primary"
                style={{ marginTop: '0.25rem' }}
              >
                Sign in to sync trips
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Real Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <StatCard icon={MapPin} value={trips.length} label="Saved Trips" color="#27F2FF" />
          <StatCard icon={Star} value={favoritesCount} label="Favorites" color="#FFB547" />
          <StatCard
            icon={History}
            value={authed ? cloudHistory.length : 0}
            label={authed ? 'History Events' : 'History (local)'}
            color="#B16DFF"
          />
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '0.375rem',
            marginBottom: '1rem',
            padding: '0.25rem',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: 'var(--radius-full)',
          }}
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1,
                padding: '0.5rem 0.25rem',
                background: tab === t.id ? 'rgba(39, 242, 255, 0.12)' : 'transparent',
                border: tab === t.id ? '1px solid rgba(39, 242, 255, 0.3)' : '1px solid transparent',
                borderRadius: 'var(--radius-full)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '0.6875rem',
                fontWeight: 700,
                color: tab === t.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                transition: 'all 200ms',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2rem' }}>
          {tab === 'trips' && (
            syncing ? (
              <div style={{ display: 'grid', gap: '0.5rem' }} aria-hidden="true">
                <Skeleton card height={92} />
                <Skeleton card height={92} />
                <Skeleton card height={92} />
              </div>
            ) : trips.length === 0 ? (
              <EmptyState
                icon={Plane}
                accent="purple"
                title="No saved trips yet"
                description="Generate your first itinerary from the Planner and it will appear here."
                actionLabel="Open Planner"
                onAction={() => router.push('/plan')}
              />
            ) : (
              trips.map((trip) => (
                <ProfileTripCard
                  key={trip.id}
                  trip={trip}
                  favorite={isFavorite(trip)}
                  onToggleFavorite={handleToggleFavorite}
                  onDelete={handleDelete}
                />
              ))
            )
          )}

          {tab === 'favorites' && (
            trips.length === 0 && !syncing ? (
              <EmptyState
                icon={Star}
                accent="amber"
                title="No trips yet"
                description="Generate a trip first — then star it to keep it here."
                actionLabel="Open Planner"
                onAction={() => router.push('/plan')}
              />
            ) : trips.filter(isFavorite).length === 0 ? (
              <EmptyState
                icon={Star}
                accent="amber"
                title="No favorites yet"
                description="Tap the star on any trip to save it here."
              />
            ) : (
              trips
                .filter(isFavorite)
                .map((trip) => (
                  <ProfileTripCard
                    key={trip.id}
                    trip={trip}
                    favorite
                    onToggleFavorite={handleToggleFavorite}
                    onDelete={handleDelete}
                  />
                ))
            )
          )}

          {tab === 'history' && (
            !authed ? (
              <EmptyState
                icon={History}
                title="History stays local"
                description="Trip history syncs across devices when you sign in."
                actionLabel="Sign in"
                onAction={() => router.push('/auth/login?next=/profile')}
              />
            ) : historyLoading ? (
              <div style={{ display: 'grid', gap: '0.5rem' }} aria-hidden="true">
                <Skeleton height={64} radius={16} />
                <Skeleton height={64} radius={16} />
                <Skeleton height={64} radius={16} />
              </div>
            ) : cloudHistory.length === 0 ? (
              <EmptyState
                icon={History}
                title="No trip activity yet"
                description="Generated, viewed, and edited trips will appear here."
              />
            ) : (
              cloudHistory.map((row, i) => {
                const meta = ACTION_META[row.action];
                const Icon = meta.icon;
                const destination = trips.find((t) => t.id === row.trip_id)?.itinerary.tripSummary.destination;
                return (
                  <motion.div
                    key={`${row.trip_id}-${row.created_at}-${i}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="glass-card-static"
                    style={{ padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                  >
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 'var(--radius-md)',
                        background: `${meta.color}14`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={15} color={meta.color} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                        {meta.label}
                        {destination ? ` — ${destination}` : ''}
                      </div>
                      <div style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)' }}>
                        {formatDate(row.created_at)} · trip {row.trip_id.slice(0, 8)}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )
          )}
        </div>

        {/* Sign Out */}
        {authed && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSignOut}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.8125rem 1rem',
              marginBottom: '1rem',
              background: 'rgba(255, 107, 107, 0.08)',
              border: '1px solid rgba(255, 107, 107, 0.25)',
              borderRadius: 'var(--radius-xl)',
              cursor: 'pointer',
              fontFamily: 'inherit',
              color: '#FF6B6B',
              fontSize: '0.875rem',
              fontWeight: 700,
            }}
          >
            <LogOut size={16} />
            Sign Out
          </motion.button>
        )}
      </div>

      <BottomNav />
    </main>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: React.ElementType;
  value: number;
  label: string;
  color: string;
}) {
  return (
    <div className="glass-card-static" style={{ padding: '1.125rem 0.5rem', textAlign: 'center' }}>
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 'var(--radius-md)',
          background: `${color}12`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 0.5rem',
        }}
      >
        <Icon size={15} color={color} />
      </div>
      <div style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <div style={{ fontSize: '0.5625rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>{label}</div>
    </div>
  );
}

function HeaderPill({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.375rem 0.75rem',
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.07)',
        borderRadius: 'var(--radius-full)',
        fontSize: '0.6875rem',
        fontWeight: 600,
        color: 'var(--color-text-secondary)',
      }}
    >
      <span style={{ color: 'var(--color-primary)' }}>{icon}</span>
      {text}
    </div>
  );
}
