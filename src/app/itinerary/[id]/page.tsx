'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Bot, Wallet, ChevronRight, Star, FileText, Share2, Mail, Send, Loader2, Sparkles } from 'lucide-react';
import { useItinerary } from '@/hooks/useItinerary';
import type { EnrichmentStatus } from '@/hooks/useItinerary';
import { useWeather } from '@/hooks/useWeather';
import { getWeatherAnchorCoords } from '@/lib/weather/anchor';
import { useItinerariesStore } from '@/hooks/useItineraries';
import { recordTripEvent } from '@/lib/trips/cloud';
import Navbar from '@/components/shared/Navbar';
import BottomNav from '@/components/shared/BottomNav';
import AIAssistantPanel from '@/components/shared/AIAssistantPanel';
import TripSummary from '@/components/itinerary/TripSummary';
import MapView from '@/components/itinerary/MapView';
import ItineraryTimeline from '@/components/itinerary/ItineraryTimeline';
import WeatherForecast from '@/components/itinerary/WeatherForecast';
import AccommodationCard from '@/components/itinerary/AccommodationCard';
import RestaurantCard from '@/components/itinerary/RestaurantCard';
import PackingChecklist from '@/components/itinerary/PackingChecklist';
import EmergencyContacts from '@/components/itinerary/EmergencyContacts';
import AILoadingAnimation from '@/components/shared/AILoadingAnimation';

// The share modal pulls in the qrcode library — load it only when the user
// actually opens the sharing panel (the link + QR code are never needed up front).
const ShareTripModal = dynamic(
  () => import('@/components/sharing/ShareTripModal'),
  { ssr: false }
);

// Enrichment progress copy — shown while POST /api/enrich upgrades the plan
// in the background. Purely cosmetic staging; the itinerary is already usable.
const ENRICHMENT_STEPS = [
  'Loading hotel information…',
  'Loading restaurants…',
  'Loading events…',
  'Finalizing your plan…',
];

function EnrichmentStatusStrip({ status }: { status: EnrichmentStatus }) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (status !== 'loading') return;
    const timer = setInterval(() => {
      setStepIndex((index) => (index + 1) % ENRICHMENT_STEPS.length);
    }, 1600);
    return () => clearInterval(timer);
  }, [status]);

  if (status !== 'loading') return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card-static"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.875rem 1.125rem',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid rgba(39, 242, 255, 0.14)',
        marginBottom: '2rem',
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 'var(--radius-md)',
          background: 'linear-gradient(135deg, rgba(39, 242, 255, 0.16), rgba(177, 109, 255, 0.16))',
        }}
      >
        <Sparkles size={17} color="#27F2FF" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.9375rem', fontWeight: 700 }}>Your itinerary is ready</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          {ENRICHMENT_STEPS[stepIndex] ?? ENRICHMENT_STEPS[0]}
        </div>
      </div>
      <Loader2 size={16} className="animate-spin" color="var(--color-text-muted)" />
    </motion.div>
  );
}

export default function ItineraryPage() {
  const params = useParams();
  const router = useRouter();
  const { itinerary, isLoading, error, destination, enrichment, applyItinerary } = useItinerary(params.id as string);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  // Email itinerary state
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [emailError, setEmailError] = useState('');

  // Auto-populate email from quick-plan flow
  useEffect(() => {
    const savedEmail = typeof window !== 'undefined'
      ? sessionStorage.getItem('atp:quick-plan-email')
      : null;
    if (savedEmail) {
      sessionStorage.removeItem('atp:quick-plan-email');
      // Defer past the current commit — synchronous setState in an effect
      // triggers a cascading re-render for no benefit here.
      const frame = requestAnimationFrame(() => setEmailAddress(savedEmail));
      return () => cancelAnimationFrame(frame);
    }
  }, []);

  const handleSendEmail = async () => {
    if (!emailAddress || !itinerary) return;
    setEmailSending(true);
    setEmailStatus('idle');
    setEmailError('');
    try {
      const res = await fetch('/api/email-itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailAddress,
          itinerary,
          destination: itinerary.tripSummary.destination,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to send email');
      }
      setEmailStatus('success');
      setTimeout(() => {
        setEmailOpen(false);
        setEmailStatus('idle');
      }, 2500);
    } catch (err) {
      setEmailStatus('error');
      setEmailError(err instanceof Error ? err.message : 'Failed to send');
    } finally {
      setEmailSending(false);
    }
  };

  // Weather anchor: the first activity with real coordinates in the plan.
  // No coordinates → no weather section (we never fabricate a forecast).
  // Memoized so the object identity stays stable across renders — the
  // useWeather effect depends on it and would otherwise refetch endlessly.
  const weatherCoords = useMemo(() => getWeatherAnchorCoords(itinerary), [itinerary]);

  const { current: currentWeather, forecast, alerts: weatherAlerts } = useWeather(
    weatherCoords,
    itinerary?.tripSummary.totalDays ?? 7
  );

  const tripId = params.id as string;
  const isFavorite = useItinerariesStore((s) => s.favorites[tripId]) ?? false;
  const toggleFavorite = useItinerariesStore((s) => s.toggleFavorite);

  // Trip history (signed-in users only): this plan was opened.
  useEffect(() => {
    void recordTripEvent(tripId, 'viewed').catch(() => {});
  }, [tripId]);

  if (isLoading) {
    return (
      <main style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
        <Navbar />
        <AILoadingAnimation destination={destination || 'your destination'} />
        <BottomNav />
      </main>
    );
  }

  if (error || !itinerary) {
    return (
      <main
        style={{
          minHeight: '100vh',
          background: 'var(--color-bg)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Navbar />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card-static"
          style={{
            textAlign: 'center',
            padding: '3rem 2rem',
            maxWidth: '420px',
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>😔</div>
          <h2 style={{ fontSize: '1.375rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Something Went Wrong
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem', fontSize: '0.875rem', lineHeight: 1.6 }}>
            {error}
          </p>
          <button onClick={() => router.push('/plan')} className="btn-primary">
            Back to Planner
          </button>
        </motion.div>
        <BottomNav />
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-bg)', paddingBottom: '5rem' }}>
      <Navbar />

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '70px 1.25rem 0' }}>
        <TripSummary summary={itinerary.tripSummary} />

        {/* Live enrichment runs in the background — the plan is already usable */}
        <EnrichmentStatusStrip status={enrichment} />

        {/* Actions row: favorite + budget module (no pricing here) */}
        <div
          style={{
            display: 'flex',
            gap: '0.625rem',
            marginBottom: '2rem',
            alignItems: 'stretch',
          }}
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => toggleFavorite(tripId)}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            style={{
              width: 52,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: isFavorite
                ? 'rgba(255, 181, 71, 0.14)'
                : 'rgba(255, 255, 255, 0.03)',
              border: `1px solid ${isFavorite ? 'rgba(255, 181, 71, 0.4)' : 'rgba(255, 255, 255, 0.06)'}`,
              borderRadius: 'var(--radius-xl)',
              cursor: 'pointer',
              color: isFavorite ? '#FFB547' : 'var(--color-text-muted)',
            }}
          >
            <Star size={18} fill={isFavorite ? '#FFB547' : 'none'} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => setShareOpen(true)}
            aria-label="Share this trip"
            title="Share this trip"
            style={{
              width: 52,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: 'var(--radius-xl)',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
            }}
          >
            <Share2 size={18} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => { setEmailOpen(!emailOpen); setEmailStatus('idle'); setEmailError(''); }}
            aria-label="Email this itinerary"
            title="Email this itinerary"
            style={{
              width: 52,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: emailOpen
                ? 'rgba(39, 242, 255, 0.14)'
                : 'rgba(255, 255, 255, 0.03)',
              border: `1px solid ${emailOpen ? 'rgba(39, 242, 255, 0.4)' : 'rgba(255, 255, 255, 0.06)'}`,
              borderRadius: 'var(--radius-xl)',
              cursor: 'pointer',
              color: emailOpen ? '#27F2FF' : 'var(--color-text-muted)',
            }}
          >
            <Mail size={18} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => router.push(`/budget/${tripId}`)}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '1rem 1.25rem',
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: 'var(--radius-xl)',
              cursor: 'pointer',
              fontFamily: 'inherit',
              textAlign: 'left',
              color: 'var(--color-text-primary)',
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, rgba(61, 220, 132, 0.2), rgba(39, 242, 255, 0.2))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Wallet size={18} color="var(--color-success)" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.9375rem', fontWeight: 700 }}>Budget Planner</div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                View estimated cost ranges for this trip
              </div>
            </div>
            <ChevronRight size={16} color="var(--color-text-muted)" />
          </motion.button>
        </div>

        {/* Email itinerary inline panel */}
        {emailOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              marginBottom: '1rem',
              padding: '1.25rem',
              background: 'rgba(39, 242, 255, 0.04)',
              border: '1px solid rgba(39, 242, 255, 0.12)',
              borderRadius: 'var(--radius-xl)',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Mail size={16} color="#27F2FF" />
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Email Itinerary
              </span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="email"
                placeholder="Enter your email address"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSendEmail(); }}
                className="glass-input"
                aria-label="Email address for itinerary"
                style={{
                  flex: 1,
                  padding: '0.625rem 0.875rem',
                  fontSize: '0.875rem',
                  borderRadius: 'var(--radius-lg)',
                }}
              />
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleSendEmail}
                disabled={emailSending || !emailAddress}
                className="btn-primary"
                style={{
                  padding: '0.625rem 1.25rem',
                  fontSize: '0.8125rem',
                  opacity: emailAddress ? 1 : 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                }}
              >
                {emailSending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
                Send
              </motion.button>
            </div>
            {emailStatus === 'success' && (
              <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--color-success)' }}>
                ✅ Itinerary sent to {emailAddress}!
              </p>
            )}
            {emailStatus === 'error' && (
              <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#FF6B6B' }}>
                ❌ {emailError}
              </p>
            )}
          </motion.div>
        )}

        {/* Travel Report — printable, PDF-ready summary of the plan */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => router.push(`/itinerary/${tripId}/report`)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1rem 1.25rem',
            marginBottom: '2rem',
            background: 'rgba(177, 109, 255, 0.07)',
            border: '1px solid rgba(177, 109, 255, 0.22)',
            borderRadius: 'var(--radius-xl)',
            cursor: 'pointer',
            fontFamily: 'inherit',
            textAlign: 'left',
            color: 'var(--color-text-primary)',
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, rgba(39, 242, 255, 0.18), rgba(177, 109, 255, 0.18))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <FileText size={18} color="#B16DFF" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.9375rem', fontWeight: 700 }}>Travel Report</div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
              Printable PDF-ready summary of your trip
            </div>
          </div>
          <ChevronRight size={16} color="var(--color-text-muted)" />
        </motion.button>

        {forecast.length > 0 && (
          <WeatherForecast forecast={forecast} current={currentWeather} alerts={weatherAlerts} />
        )}

        <MapView
          dailyItinerary={itinerary.dailyItinerary}
          accommodations={itinerary.accommodations}
          restaurants={itinerary.restaurants}
          hiddenGems={itinerary.hiddenGems}
        />

        <ItineraryTimeline dailyItinerary={itinerary.dailyItinerary} />

        <AccommodationCard accommodations={itinerary.accommodations} />

        <RestaurantCard restaurants={itinerary.restaurants} />

        <PackingChecklist initialChecklist={itinerary.packingChecklist} />

        <EmergencyContacts
          contacts={itinerary.emergencyContacts}
          travelTips={itinerary.travelTips}
          localCustoms={itinerary.localCustoms}
          importantNotes={itinerary.importantNotes}
        />
      </div>

      {/* Floating AI Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setAiPanelOpen(true)}
        aria-label="Open AI assistant"
        style={{
          position: 'fixed',
          bottom: '5.5rem',
          right: '1.25rem',
          width: 52,
          height: 52,
          borderRadius: 'var(--radius-full)',
          background: 'linear-gradient(135deg, #27F2FF, #B16DFF)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(39, 242, 255, 0.4)',
          zIndex: 80,
        }}
      >
        <Bot size={22} color="#090B10" />
      </motion.button>

      <AIAssistantPanel
        isOpen={aiPanelOpen}
        onClose={() => setAiPanelOpen(false)}
        itinerary={itinerary}
        onApply={applyItinerary}
      />
      {shareOpen && <ShareTripModal tripId={tripId} itinerary={itinerary} onClose={() => setShareOpen(false)} />}
      <BottomNav />
    </main>
  );
}