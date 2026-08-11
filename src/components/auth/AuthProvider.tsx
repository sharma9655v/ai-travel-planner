'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react';
import type { Session, SupabaseClient, User } from '@supabase/supabase-js';

export const GUEST_COOKIE = 'atp_guest';

// Supabase is only present when configured — import it lazily so its ~13KB
// (gzipped) bundle isn't paid by every page in guest mode.
async function loadSupabaseClient(): Promise<SupabaseClient | null> {
  const { getSupabaseBrowserClient } = await import('@/lib/supabase/client');
  return getSupabaseBrowserClient();
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isGuest: boolean;
  signInWithGoogle: (next?: string) => Promise<void>;
  signInWithGitHub: (next?: string) => Promise<void>;
  signOut: () => Promise<void>;
  continueAsGuest: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function isGuestCookieSet(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.split('; ').some((c) => c.startsWith(`${GUEST_COOKIE}=1`));
}

function setGuestCookie(value: string | null): void {
  if (typeof document === 'undefined') return;
  document.cookie = value
    ? `${GUEST_COOKIE}=1; path=/; max-age=2592000; samesite=lax`
    : `${GUEST_COOKIE}=; path=/; max-age=0; samesite=lax`;
  // Notify useSyncExternalStore subscribers immediately.
  window.dispatchEvent(new Event('guest-cookie-change'));
}

function subscribeGuestCookie(onStoreChange: () => void): () => void {
  window.addEventListener('guest-cookie-change', onStoreChange);
  window.addEventListener('focus', onStoreChange);
  return () => {
    window.removeEventListener('guest-cookie-change', onStoreChange);
    window.removeEventListener('focus', onStoreChange);
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [client, setClient] = useState<SupabaseClient | null>(null);

  const isGuest = useSyncExternalStore(
    subscribeGuestCookie,
    isGuestCookieSet,
    () => false
  );

  // Supabase is optional: guest mode when unconfigured or unavailable.
  useEffect(() => {
    let active = true;
    loadSupabaseClient()
      .then((c) => {
        if (!active) return;
        setClient(c);
        if (!c) setIsLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setClient(null);
        setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!client) return;

    let active = true;

    client.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setIsLoading(false);
    });

    const { data: subscription } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [client]);

  const oauthRedirect = useCallback((next?: string) => {
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    return `${base}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ''}`;
  }, []);

  const signInWithGoogle = useCallback(
    async (next?: string) => {
      const c = await loadSupabaseClient();
      if (!c) throw new Error('AUTH_NOT_CONFIGURED');
      await c.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: oauthRedirect(next) },
      });
    },
    [oauthRedirect]
  );

  const signInWithGitHub = useCallback(
    async (next?: string) => {
      const c = await loadSupabaseClient();
      if (!c) throw new Error('AUTH_NOT_CONFIGURED');
      await c.auth.signInWithOAuth({
        provider: 'github',
        options: { redirectTo: oauthRedirect(next) },
      });
    },
    [oauthRedirect]
  );

  const signOut = useCallback(async () => {
    const c = await loadSupabaseClient();
    if (c) {
      await c.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setGuestCookie(null);
  }, []);

  const continueAsGuest = useCallback(() => {
    setGuestCookie('1');
  }, []);

  const value = useMemo(
    () => ({
      user,
      session,
      isLoading,
      isGuest,
      signInWithGoogle,
      signInWithGitHub,
      signOut,
      continueAsGuest,
    }),
    [user, session, isLoading, isGuest, signInWithGoogle, signInWithGitHub, signOut, continueAsGuest]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
