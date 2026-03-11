import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Trading Journal — TradVue',
  description:
    'Log and analyze every trade. Track your wins, losses, patterns, and progress with TradVue\'s AI-powered trading journal.',
  openGraph: {
    title: 'Trading Journal — TradVue',
    description:
      'Log and analyze every trade. Track wins, losses, patterns, and progress with AI-powered insights.',
    url: 'https://www.tradvue.com/journal',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Trading Journal — TradVue',
    description:
      'Log and analyze every trade. Track wins, losses, and patterns with AI-powered insights.',
  },
  alternates: {
    canonical: 'https://www.tradvue.com/journal',
  },
}

export default function JournalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
