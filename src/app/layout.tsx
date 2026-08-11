import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/auth/AuthProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  // NEXT_PUBLIC_APP_URL is the documented contract (.env.example, deployment
  // checklist); NEXT_PUBLIC_SITE_URL is kept as a legacy fallback. Without a
  // real origin, OG/canonical metadata would resolve against localhost.
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  ),
  title: 'AI Travel Planner — Plan Your Perfect Trip with AI',
  description:
    'Experience the future of travel planning. AI-powered itineraries, route optimization, real-time weather, budget planning, and more — all in one premium platform.',
  keywords: [
    'AI travel planner',
    'trip planner',
    'itinerary generator',
    'travel AI',
    'personalized travel',
    'route optimization',
    'weather-aware itinerary',
  ],
  openGraph: {
    title: 'AI Travel Planner — Plan Your Perfect Trip with AI',
    description: 'The world\'s most advanced AI travel assistant.',
    type: 'website',
    images: [{ url: '/og-card.png', width: 1200, height: 630, alt: 'AI Travel Planner' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Travel Planner — Plan Your Perfect Trip with AI',
    description: 'The world\'s most advanced AI travel assistant.',
    images: ['/og-card.png'],
  },
};

export const viewport: Viewport = {
  themeColor: '#090B10',
};

// The security proxy (src/proxy.ts) issues a per-request CSP nonce, which
// requires dynamic rendering — static pages are built without a request and
// would render scripts without a nonce, breaking them under strict CSP.
export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${inter.variable}`} suppressHydrationWarning>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
