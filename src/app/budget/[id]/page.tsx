'use client';

import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useItinerary } from '@/hooks/useItinerary';
import Navbar from '@/components/shared/Navbar';
import BottomNav from '@/components/shared/BottomNav';
import AILoadingAnimation from '@/components/shared/AILoadingAnimation';
import BudgetDashboard from '@/components/budget/BudgetDashboard';

export default function BudgetPage() {
  const params = useParams();
  const router = useRouter();
  const { itinerary, isLoading, error, destination } = useItinerary(params.id as string);

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
          style={{ textAlign: 'center', padding: '3rem 2rem', maxWidth: '420px' }}
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
        {/* Back to itinerary */}
        <motion.button
          whileHover={{ x: -3 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => router.push(`/itinerary/${params.id}`)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
            color: 'var(--color-text-secondary)',
            fontSize: '0.8125rem',
            fontWeight: 600,
            marginBottom: '1rem',
            padding: '0.375rem 0',
          }}
        >
          <ArrowLeft size={15} />
          Back to Itinerary
        </motion.button>

        <BudgetDashboard itinerary={itinerary} />
      </div>

      <BottomNav />
    </main>
  );
}
