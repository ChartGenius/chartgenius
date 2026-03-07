import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Help Center & FAQ | ChartGenius',
  description:
    'Find answers to common questions about ChartGenius — account setup, pricing, data sources, alerts, troubleshooting, and more.',
  keywords: [
    'ChartGenius help',
    'ChartGenius FAQ',
    'stock market app help',
    'trading platform support',
    'watchlist help',
    'price alerts',
    'ChartGenius support',
  ],
  openGraph: {
    title: 'Help Center & FAQ | ChartGenius',
    description:
      'Find answers to common questions about ChartGenius — account setup, pricing, data sources, alerts, troubleshooting, and more.',
    url: 'https://chartgenius.io/help',
    siteName: 'ChartGenius',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Help Center & FAQ | ChartGenius',
    description:
      'Answers to common questions about ChartGenius — accounts, billing, data, and troubleshooting.',
  },
  alternates: {
    canonical: 'https://chartgenius.io/help',
  },
}

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
