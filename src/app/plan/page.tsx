'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from '@/components/shared/Navbar';
import BottomNav from '@/components/shared/BottomNav';
import { useQuestionnaireStore } from '@/hooks/useQuestionnaire';
import TripDetailsStep from '@/components/questionnaire/TripDetailsStep';
import TravelersStep from '@/components/questionnaire/TravelersStep';
import BudgetStep from '@/components/questionnaire/BudgetStep';
import TransportStep from '@/components/questionnaire/TransportStep';
import AccommodationStep from '@/components/questionnaire/AccommodationStep';
import FoodStep from '@/components/questionnaire/FoodStep';
import InterestsStep from '@/components/questionnaire/InterestsStep';
import StyleStep from '@/components/questionnaire/StyleStep';
import ReviewStep from '@/components/questionnaire/ReviewStep';
import { Sparkles } from 'lucide-react';

export default function PlanPage() {
  const { currentStep, totalSteps } = useQuestionnaireStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-bg)', paddingBottom: '5rem' }}>
      <Navbar />

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '70px 1.25rem 0' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', marginBottom: '1.5rem' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Sparkles size={16} color="var(--color-primary)" />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-primary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Step {currentStep} of {totalSteps}
            </span>
          </div>
        </motion.div>

        {/* Progress Bar */}
        <div style={{ marginBottom: '2rem' }}>
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Form Container */}
        <div
          className="glass-card-static"
          style={{
            padding: '2rem 1.5rem',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle gradient */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background: 'linear-gradient(90deg, #27F2FF, #B16DFF, #27F2FF)',
              backgroundSize: '200% 100%',
              animation: 'gradient-shift 3s ease infinite',
            }}
          />

          <AnimatePresence mode="wait">
            {currentStep === 1 && <TripDetailsStep key="step-1" />}
            {currentStep === 2 && <TravelersStep key="step-2" />}
            {currentStep === 3 && <BudgetStep key="step-3" />}
            {currentStep === 4 && <TransportStep key="step-4" />}
            {currentStep === 5 && <AccommodationStep key="step-5" />}
            {currentStep === 6 && <FoodStep key="step-6" />}
            {currentStep === 7 && <InterestsStep key="step-7" />}
            {currentStep === 8 && <StyleStep key="step-8" />}
            {currentStep === 9 && <ReviewStep key="step-9" />}
          </AnimatePresence>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
