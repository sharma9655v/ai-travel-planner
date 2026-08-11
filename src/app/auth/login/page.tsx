'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plane, UserRound, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { safeRedirectPath } from '@/lib/utils';
import Navbar from '@/components/shared/Navbar';
import BottomNav from '@/components/shared/BottomNav';

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeRedirectPath(searchParams.get('next'), '/profile');
  const error = searchParams.get('error');
  const [signInError, setSignInError] = useState<string | null>(null);
  const { user, isLoading, isGuest, signInWithGoogle, signInWithGitHub, continueAsGuest } = useAuth();

  if (!isLoading && user && !isGuest) {
    router.replace(next);
  }

  const guest = () => {
    continueAsGuest();
    router.push(next);
  };

  const providerSignIn = async (signIn: (next?: string) => Promise<void>) => {
    setSignInError(null);
    try {
      await signIn(next);
    } catch {
      setSignInError("Sign-in isn't set up on this server yet. Continue as guest instead.");
    }
  };

  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Navbar />

      <div
        style={{
          minHeight: 'calc(100vh - 56px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '5rem 1.25rem 7rem',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass-card-static"
          style={{
            width: '100%',
            maxWidth: 420,
            padding: '2.25rem 1.75rem',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -60,
              right: -60,
              width: 180,
              height: 180,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(39, 242, 255, 0.12) 0%, transparent 70%)',
              filter: 'blur(40px)',
            }}
          />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 'var(--radius-xl)',
                background: 'linear-gradient(135deg, #27F2FF 0%, #B16DFF 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
                boxShadow: '0 4px 20px rgba(39, 242, 255, 0.35)',
              }}
            >
              <Plane size={24} color="#090B10" style={{ transform: 'rotate(-45deg)' }} />
            </div>

            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Welcome Back
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: '1.75rem' }}>
              Sign in to sync your saved trips, favorites, and trip history across devices.
            </p>

            {(error || signInError) && (
              <div
                style={{
                  marginBottom: '1rem',
                  padding: '0.625rem 0.875rem',
                  background: 'rgba(255, 107, 107, 0.1)',
                  border: '1px solid rgba(255, 107, 107, 0.3)',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: '0.75rem',
                  color: '#FF6B6B',
                }}
              >
                {signInError ?? 'Sign-in failed. Please try again.'}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              <ProviderButton
                label="Continue with Google"
                onDarkBg={false}
                onClick={() => providerSignIn(signInWithGoogle)}
                emoji="G"
                color="#EA4335"
              />
              <ProviderButton
                label="Continue with GitHub"
                onDarkBg={false}
                onClick={() => providerSignIn(signInWithGitHub)}
                emoji="⌥"
                color="#8B949E"
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1.25rem 0' }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255, 255, 255, 0.08)' }} />
              <span style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                or
              </span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255, 255, 255, 0.08)' }} />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={guest}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.8125rem 1rem',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 'var(--radius-xl)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                color: 'var(--color-text-primary)',
                fontSize: '0.875rem',
                fontWeight: 700,
              }}
            >
              <UserRound size={16} color="var(--color-primary)" />
              Continue as Guest
              <ArrowRight size={15} color="var(--color-text-muted)" />
            </motion.button>

            <p style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', marginTop: '1rem', lineHeight: 1.5 }}>
              Guest mode works fully but keeps your trips on this device only. No sign-up required.
            </p>
          </div>
        </motion.div>
      </div>

      <BottomNav />
    </main>
  );
}

function ProviderButton({
  label,
  onClick,
  emoji,
  color,
  onDarkBg,
}: {
  label: string;
  onClick: () => void;
  emoji: string;
  color: string;
  onDarkBg: boolean;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.625rem',
        padding: '0.8125rem 1rem',
        background: onDarkBg ? '#FFF' : 'rgba(255, 255, 255, 0.06)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: 'var(--radius-xl)',
        cursor: 'pointer',
        fontFamily: 'inherit',
        color: onDarkBg ? '#090B10' : 'var(--color-text-primary)',
        fontSize: '0.875rem',
        fontWeight: 700,
      }}
    >
      <span
        style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: `${color}1f`,
          color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.8125rem',
          fontWeight: 800,
        }}
      >
        {emoji}
      </span>
      {label}
    </motion.button>
  );
}
