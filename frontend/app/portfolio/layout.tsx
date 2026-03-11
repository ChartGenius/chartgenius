import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Portfolio Tracker — TradVue',
  description:
    'Track your stock and crypto portfolio with real-time P&L, dividend tracking, sector allocation, and performance analytics.',
  openGraph: {
    title: 'Portfolio Tracker — TradVue',
    description:
      'Track your stock and crypto portfolio with real-time P&L, dividend tracking, sector allocation, and performance analytics.',
    url: 'https://www.tradvue.com/portfolio',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Portfolio Tracker — TradVue',
    description:
      'Track your portfolio with real-time P&L, dividend tracking, and sector allocation.',
  },
  alternates: {
    canonical: 'https://www.tradvue.com/portfolio',
  },
}

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
