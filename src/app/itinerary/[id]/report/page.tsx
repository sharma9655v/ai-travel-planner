'use client';

import { useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, Printer } from 'lucide-react';
import { useItinerary } from '@/hooks/useItinerary';
import { useWeather } from '@/hooks/useWeather';
import { getWeatherAnchorCoords } from '@/lib/weather/anchor';
import { normalizeBudget } from '@/lib/budget/normalize';
import Navbar from '@/components/shared/Navbar';
import BottomNav from '@/components/shared/BottomNav';
import AILoadingAnimation from '@/components/shared/AILoadingAnimation';
import ReportCover from '@/components/report/ReportCover';
import ReportSections from '@/components/report/ReportSections';

export default function TravelReportPage() {
  const params = useParams();
  const router = useRouter();
  const { itinerary, isLoading, error, destination } = useItinerary(params.id as string);

  // Weather anchor: memoized so its object identity is stable across renders —
  // the useWeather effect depends on it and would otherwise refetch endlessly.
  const weatherCoords = useMemo(() => getWeatherAnchorCoords(itinerary), [itinerary]);
  const { current: currentWeather, forecast, alerts: weatherAlerts } = useWeather(
    weatherCoords,
    itinerary?.tripSummary.totalDays ?? 7
  );

  const budget = useMemo(() => (itinerary ? normalizeBudget(itinerary) : null), [itinerary]);

  useEffect(() => {
    if (!itinerary) return;
    const previousTitle = document.title;
    document.title = `${itinerary.tripSummary.destination} — Travel Report`;
    return () => {
      document.title = previousTitle;
    };
  }, [itinerary]);

  if (isLoading) {
    return (
      <main style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
        <Navbar />
        <AILoadingAnimation destination={destination || 'your destination'} />
        <BottomNav />
      </main>
    );
  }

  if (error || !itinerary || !budget) {
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
          style={{ textAlign: 'center', padding: '3rem 2rem', maxWidth: '420px' }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>😔</div>
          <h2 style={{ fontSize: '1.375rem', fontWeight: 700, marginBottom: '0.5rem' }}>Something Went Wrong</h2>
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

  const activityCount = itinerary.dailyItinerary.reduce(
    (sum, day) => sum + (day.activities?.length ?? 0),
    0
  );
  const currency = itinerary.tripSummary.currency || itinerary.budgetBreakdown.currency || 'INR';

  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-bg)', paddingBottom: '4rem' }}>
      <div className="no-print">
        <Navbar />
      </div>

      {/* Toolbar (screen only) */}
      <div
        className="no-print"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 60,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.65rem 1.25rem',
          background: 'rgba(9, 11, 16, 0.85)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
        }}
      >
        <button
          onClick={() => router.push(`/itinerary/${params.id}`)}
          aria-label="Back to itinerary"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 38,
            height: 38,
            flexShrink: 0,
            borderRadius: 'var(--radius-md)',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            cursor: 'pointer',
            color: 'var(--color-text-secondary)',
          }}
        >
          <ArrowLeft size={17} />
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
            <FileText size={14} color="var(--color-primary)" />
            Travel Report
          </div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
            {itinerary.tripSummary.destination} · {itinerary.tripSummary.totalDays} days
          </div>
        </div>

        <button
          onClick={() => window.print()}
          className="btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8125rem' }}
        >
          <Printer size={15} />
          Export PDF
        </button>
      </div>

      <div className="report-root" style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1.25rem' }}>
        <ReportCover
          summary={itinerary.tripSummary}
          activitiesCount={activityCount}
          accommodationsCount={itinerary.accommodations.length}
          restaurantsCount={itinerary.restaurants.length}
          currency={currency}
        />

        <ReportSections
          itinerary={itinerary}
          forecast={forecast}
          currentWeather={currentWeather}
          weatherAlerts={weatherAlerts}
          budget={budget}
        />
      </div>

      <div className="no-print">
        <BottomNav />
      </div>
    </main>
  );
}
