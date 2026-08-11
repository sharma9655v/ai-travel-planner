'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import Navbar from '@/components/shared/Navbar';
import BottomNav from '@/components/shared/BottomNav';
import QuickPlanForm from '@/components/questionnaire/QuickPlanForm';
import { fadeUp } from '@/lib/motion';

// ============================================================
// Quick Plan Page — streamlined single-page trip planning form
// Maps the n8n workflow's "Trip Request Form" into the app UI
// ============================================================

export default function QuickPlanPage() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-bg)', paddingBottom: '5rem' }}>
      <Navbar />

      <div style={{ maxWidth: '620px', margin: '0 auto', padding: '70px 1.25rem 0' }}>
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', marginBottom: '2rem' }}
        >
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              marginBottom: '0.75rem',
            }}
          >
            <Sparkles size={20} color="var(--color-primary)" />
            <h1 style={{ fontSize: 'clamp(1.25rem, 4vw, 1.75rem)', fontWeight: 800, margin: 0 }}>
              Quick <span className="gradient-text">Plan</span>
            </h1>
          </motion.div>
          <p
            style={{
              fontSize: '0.9375rem',
              color: 'var(--color-text-secondary)',
              maxWidth: '420px',
              margin: '0 auto',
              lineHeight: 1.6,
            }}
          >
            Tell us about your trip and we&apos;ll craft a personalized itinerary for you.
          </p>
        </motion.div>

        {/* Form card */}
        <div
          className="glass-card-static"
          style={{
            padding: '2rem 1.5rem',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Top accent gradient bar */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background: 'linear-gradient(90deg, #27F2FF, #B16DFF, #3DDC84)',
              backgroundSize: '200% 100%',
              animation: 'gradient-shift 3s ease infinite',
            }}
          />

          <QuickPlanForm />
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
