import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Portfolio Tracker — Real-Time P&L, Dividends & Sector Allocation',
  description:
    'Track your stock and crypto portfolio with real-time P&L, dividend income tracking, sector allocation, DRIP simulation, and performance analytics. Free to start.',
  openGraph: {
    title: 'Portfolio Tracker — Real-Time P&L, Dividends & Sector Allocation | TradVue',
    description:
      'Track your portfolio with real-time P&L, dividend tracking, sector allocation, and performance analytics. Free to start.',
    url: 'https://www.tradvue.com/portfolio',
    type: 'website',
    images: [{ url: 'https://www.tradvue.com/og-image.png', width: 1200, height: 630, alt: 'TradVue Portfolio Tracker' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Portfolio Tracker | TradVue',
    description:
      'Real-time P&L, dividend tracking, sector allocation, and performance analytics.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: 'https://www.tradvue.com/portfolio',
  },
}

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
