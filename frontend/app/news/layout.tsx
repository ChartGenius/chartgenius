import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Market News — TradVue',
  description:
    'Real-time market news with AI-powered sentiment analysis. Stay ahead of market-moving events with curated financial news across stocks, crypto, forex, and commodities.',
  openGraph: {
    title: 'Market News — TradVue',
    description:
      'Real-time market news with AI sentiment analysis across stocks, crypto, forex, and commodities.',
    url: 'https://www.tradvue.com/news',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Market News — TradVue',
    description:
      'Real-time market news with AI sentiment analysis. Stay ahead of market-moving events.',
  },
  alternates: {
    canonical: 'https://www.tradvue.com/news',
  },
}

export default function NewsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
