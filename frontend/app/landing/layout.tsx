import type { Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL('https://www.tradvue.com'),
  // ── Title & Description ────────────────────────────────────────────────
  title: 'TradVue — The Trader Operating System for Journal, Portfolio, Tools & Market Intel',
  description:
    'TradVue brings trading journal, portfolio tracking, prop firm monitoring, calculators, post-trade ritual, and market intel into one platform. Free to start — no credit card required.',

  // ── Keywords ──────────────────────────────────────────────────────────
  keywords: [
    'trading journal',
    'portfolio tracker',
    'prop firm tracker',
    'trading calculators',
    'post-trade ritual',
    'market intel',
    'trader tools',
    'trading platform',
  ],

  // ── Open Graph ────────────────────────────────────────────────────────
  openGraph: {
    type: 'website',
    url: 'https://tradvue.com/landing',
    siteName: 'TradVue',
    title: 'TradVue — The Trader Operating System for Journal, Portfolio, Tools & Market Intel',
    description:
      'TradVue brings trading journal, portfolio tracking, calculators, prop firm tracking, ritual, and market intel into one trader workflow.',
    images: [
      {
        url: 'https://www.tradvue.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TradVue — Trader operating system',
      },
    ],
  },

  // ── Twitter Card ──────────────────────────────────────────────────────
  twitter: {
    card: 'summary_large_image',
    site: '@tradvue',
    creator: '@tradvue',
    title: 'TradVue — The Trader Operating System for Journal, Portfolio, Tools & Market Intel',
    description: 'Trading journal, portfolio tracking, prop firm tools, calculators, ritual, and market intel in one platform. Free to start.',
    images: ['https://www.tradvue.com/og-twitter.png'],
  },

  // ── Robots ────────────────────────────────────────────────────────────
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },

  // ── Canonical ─────────────────────────────────────────────────────────
  alternates: {
    canonical: 'https://www.tradvue.com/landing',
  },
}

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
