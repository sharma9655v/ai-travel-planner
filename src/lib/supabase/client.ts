'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

// Browser Supabase client (anon key is public by design).
// Returns null until NEXT_PUBLIC_SUPABASE_URL / ANON_KEY are configured —
// the app degrades to guest mode instead of crashing.
let cachedClient: SupabaseClient | null | undefined;

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (cachedClient !== undefined) return cachedClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.warn('[auth] Supabase is not configured — running without accounts.');
    cachedClient = null;
    return null;
  }

  cachedClient = createBrowserClient(url, anonKey);
  return cachedClient;
}
