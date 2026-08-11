'use client';

import { motion } from 'framer-motion';
import {
  MapPin,
  Calendar,
  Wallet,
  Users,
  Heart,
  Mail,
  Sparkles,
  Loader2,
  ArrowRight,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useQuickPlan } from '@/hooks/useQuickPlan';
import { fadeUp, stagger } from '@/lib/motion';

// ============================================================
// Quick Plan Form — single-page form matching the n8n workflow
// ============================================================

export default function QuickPlanForm() {
  const {
    formData,
    updateField,
    isGenerating,
    error,
    canGenerate,
    handleGenerate,
  } = useQuickPlan();

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={stagger}
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
    >
      {/* Header badge */}
      <motion.div variants={fadeUp} style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.375rem 1rem',
            background: 'rgba(39, 242, 255, 0.08)',
            border: '1px solid rgba(39, 242, 255, 0.15)',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--color-primary)',
            letterSpacing: '0.03em',
          }}
        >
          <Zap size={12} />
          Quick Plan — 7 fields, 1 minute
        </span>
      </motion.div>

      {/* Email (optional) */}
      <motion.div variants={fadeUp}>
        <FormField
          icon={<Mail size={18} />}
          label="Your Email"
          sublabel="Optional — we'll email you the itinerary"
          type="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={(val) => updateField('email', val)}
          id="quick-email"
        />
      </motion.div>

      {/* Destination (required) */}
      <motion.div variants={fadeUp}>
        <FormField
          icon={<MapPin size={18} />}
          label="Destination"
          type="text"
          placeholder="e.g. Tokyo, Japan"
          value={formData.destination}
          onChange={(val) => updateField('destination', val)}
          required
          id="quick-destination"
        />
      </motion.div>

      {/* Date row */}
      <motion.div
        variants={fadeUp}
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}
      >
        <FormField
          icon={<Calendar size={18} />}
          label="Start Date"
          type="date"
          value={formData.startDate}
          onChange={(val) => updateField('startDate', val)}
          required
          id="quick-start-date"
        />
        <FormField
          icon={<Calendar size={18} />}
          label="End Date"
          type="date"
          value={formData.endDate}
          onChange={(val) => updateField('endDate', val)}
          required
          id="quick-end-date"
        />
      </motion.div>

      {/* Budget */}
      <motion.div variants={fadeUp}>
        <FormField
          icon={<Wallet size={18} />}
          label="Budget"
          sublabel="Any format — we'll figure it out"
          type="text"
          placeholder="e.g. $2000 total, mid-range"
          value={formData.budget}
          onChange={(val) => updateField('budget', val)}
          id="quick-budget"
        />
      </motion.div>

      {/* Travelers */}
      <motion.div variants={fadeUp}>
        <FormField
          icon={<Users size={18} />}
          label="Travelers"
          type="text"
          placeholder="e.g. 2 adults"
          value={formData.travelers}
          onChange={(val) => updateField('travelers', val)}
          id="quick-travelers"
        />
      </motion.div>

      {/* Interests */}
      <motion.div variants={fadeUp}>
        <FormField
          icon={<Heart size={18} />}
          label="Interests"
          sublabel="Comma-separated list of what you love"
          type="textarea"
          placeholder="e.g. food, museums, hiking, nightlife"
          value={formData.interests}
          onChange={(val) => updateField('interests', val)}
          id="quick-interests"
        />
      </motion.div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '0.625rem 0.875rem',
            background: 'rgba(255, 107, 107, 0.1)',
            border: '1px solid rgba(255, 107, 107, 0.3)',
            borderRadius: 'var(--radius-lg)',
            fontSize: '0.75rem',
            color: '#FF6B6B',
          }}
        >
          {error}
        </motion.div>
      )}

      {/* Generate Button */}
      <motion.div variants={fadeUp} style={{ marginTop: '0.5rem' }}>
        <button
          onClick={handleGenerate}
          disabled={!canGenerate || isGenerating}
          className="btn-primary"
          id="quick-generate-btn"
          style={{
            width: '100%',
            padding: '1.125rem',
            fontSize: '1.125rem',
            boxShadow: canGenerate
              ? '0 8px 25px rgba(39, 242, 255, 0.3)'
              : 'none',
            opacity: canGenerate ? 1 : 0.5,
          }}
        >
          {isGenerating ? (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
              }}
            >
              <Loader2 className="animate-spin" size={20} />
              Preparing...
            </span>
          ) : (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              <Sparkles size={18} />
              Generate My Itinerary
            </span>
          )}
        </button>
        <p
          style={{
            marginTop: '0.75rem',
            fontSize: '0.75rem',
            color: 'var(--color-text-muted)',
            textAlign: 'center',
          }}
        >
          Takes 15-30 seconds • Powered by AI
        </p>
      </motion.div>

      {/* Link to full planner */}
      <motion.div variants={fadeUp} style={{ textAlign: 'center' }}>
        <Link
          href="/plan"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            fontSize: '0.8125rem',
            color: 'var(--color-text-muted)',
            textDecoration: 'none',
            transition: 'color 0.2s',
          }}
          className="btn-ghost"
        >
          Want more control? Use the detailed planner
          <ArrowRight size={14} />
        </Link>
      </motion.div>
    </motion.div>
  );
}

// ============================================================
// Reusable Form Field
// ============================================================

function FormField({
  icon,
  label,
  sublabel,
  placeholder,
  value,
  onChange,
  type = 'text',
  required,
  id,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  placeholder?: string;
  value: string;
  onChange: (val: string) => void;
  type?: string;
  required?: boolean;
  id: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        style={{
          display: 'block',
          fontSize: '0.8125rem',
          fontWeight: 600,
          color: 'var(--color-text-secondary)',
          marginBottom: sublabel ? '0.125rem' : '0.5rem',
        }}
      >
        {label}
        {required && (
          <span style={{ color: '#FF6B6B', marginLeft: '0.25rem' }}>*</span>
        )}
      </label>
      {sublabel && (
        <span
          style={{
            display: 'block',
            fontSize: '0.6875rem',
            color: 'var(--color-text-muted)',
            marginBottom: '0.5rem',
          }}
        >
          {sublabel}
        </span>
      )}
      <div
        style={{
          display: 'flex',
          alignItems: type === 'textarea' ? 'flex-start' : 'center',
          gap: '0.75rem',
          padding: type === 'textarea' ? '0.875rem 1rem' : '0.75rem 1rem',
          background: 'var(--color-card)',
          border: '2px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          transition: 'border-color 0.2s ease',
        }}
      >
        <span
          style={{
            color: 'var(--color-text-muted)',
            flexShrink: 0,
            marginTop: type === 'textarea' ? '0.125rem' : 0,
          }}
        >
          {icon}
        </span>
        {type === 'textarea' ? (
          <textarea
            id={id}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: '0.9375rem',
              color: 'var(--color-text-primary)',
              fontFamily: 'inherit',
              resize: 'vertical',
              lineHeight: 1.5,
            }}
          />
        ) : (
          <input
            id={id}
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: '0.9375rem',
              color: 'var(--color-text-primary)',
              fontFamily: 'inherit',
            }}
          />
        )}
      </div>
    </div>
  );
}
