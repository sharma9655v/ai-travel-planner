import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { safeRedirectPath } from '@/lib/utils';

// OAuth callback — Supabase redirects here after Google/GitHub login with a
// code; we exchange it for a session cookie and continue to the requested page.
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = safeRedirectPath(url.searchParams.get('next'), '/profile');

  if (code) {
    const supabase = await getSupabaseServerClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(new URL(next, request.url));
      }
      console.error('Auth exchange error:', error.message);
    }
  }

  return NextResponse.redirect(new URL('/auth/login?error=auth', request.url));
}
