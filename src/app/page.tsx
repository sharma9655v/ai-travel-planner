'use client';

import LandingNavbar from '@/components/landing/LandingNavbar';
import LandingHero from '@/components/landing/LandingHero';
import HowItWorks from '@/components/landing/HowItWorks';
import Showcase from '@/components/landing/Showcase';
import AiRefinement from '@/components/landing/AiRefinement';
import Features from '@/components/landing/Features';
import Destinations from '@/components/landing/Destinations';
import TravelStyles from '@/components/landing/TravelStyles';
import LandingFooter from '@/components/landing/LandingFooter';

// ============================================================
// Landing Page — premium marketing page over the existing app.
// All CTAs point at existing routes (/plan, /map, /profile,
// /quick-plan); nothing here calls any API.
// ============================================================

export default function HomePage() {
  return (
    <main style={{ minHeight: '100vh', overflowX: 'hidden' }}>
      <LandingNavbar />
      <LandingHero />
      <HowItWorks />
      <Showcase />
      <AiRefinement />
      <Features />
      <Destinations />
      <TravelStyles />
      <LandingFooter />
    </main>
  );
}