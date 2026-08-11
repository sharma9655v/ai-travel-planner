'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useQuestionnaireStore } from '@/hooks/useQuestionnaire';

interface StepWrapperProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  canProceed?: boolean;
  hideNext?: boolean;
  onNext?: () => void;
}

export default function StepWrapper({
  title,
  subtitle,
  children,
  canProceed = true,
  hideNext = false,
  onNext,
}: StepWrapperProps) {
  const { currentStep, totalSteps, nextStep, prevStep } = useQuestionnaireStore();

  const handleNext = () => {
    if (onNext) {
      onNext();
    } else {
      nextStep();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      style={{
        width: '100%',
        maxWidth: '720px',
        margin: '0 auto',
      }}
    >
      {/* Step Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.5rem',
          }}
        >
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--color-primary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Step {currentStep} of {totalSteps}
          </span>
        </div>
        <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{title}</h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem' }}>{subtitle}</p>
      </div>

      {/* Step Content */}
      <div style={{ marginBottom: '2.5rem' }}>{children}</div>

      {/* Navigation */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '1.5rem',
          borderTop: '1px solid var(--color-border)',
        }}
      >
        <button
          onClick={prevStep}
          disabled={currentStep === 1}
          className="btn-secondary"
          style={{
            opacity: currentStep === 1 ? 0.4 : 1,
            cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
            padding: '0.625rem 1.5rem',
          }}
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {!hideNext && (
          <button
            onClick={handleNext}
            disabled={!canProceed}
            className="btn-primary"
            style={{
              opacity: canProceed ? 1 : 0.5,
              cursor: canProceed ? 'pointer' : 'not-allowed',
              padding: '0.625rem 1.5rem',
            }}
          >
            {currentStep === totalSteps ? 'Generate Itinerary' : 'Continue'}
            <ArrowRight size={16} />
          </button>
        )}
      </div>
    </motion.div>
  );
}
