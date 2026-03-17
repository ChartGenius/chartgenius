import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI Trading Coach — Get AI Analysis of Your Trades',
  description:
    'Let TradVue\'s AI coach analyze your trade journal, spot patterns, and give actionable feedback on your trading performance. Free to try.',
  alternates: { canonical: 'https://www.tradvue.com/coach' },
  openGraph: {
    title: 'AI Trading Coach | TradVue',
    description: 'AI-powered trade analysis and coaching. Spot patterns, find your edge, improve your trading.',
    url: 'https://www.tradvue.com/coach',
    type: 'website',
    images: [{ url: 'https://www.tradvue.com/og-image.png', width: 1200, height: 630, alt: 'TradVue AI Trading Coach' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Trading Coach | TradVue',
    description: 'AI analysis of your trades. Spot patterns and find your edge.',
    images: ['/og-image.png'],
  },
}

export default function CoachLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
