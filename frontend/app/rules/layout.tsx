import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Trading Rules — Set & Enforce Your Personal Rules',
  description:
    'Define and track your personal trading rules in TradVue. Get reminders before you trade and see your rule compliance stats over time.',
  alternates: { canonical: 'https://www.tradvue.com/rules' },
  openGraph: {
    title: 'Trading Rules | TradVue',
    description: 'Set and track your personal trading rules. Get compliance reminders.',
    url: 'https://www.tradvue.com/rules',
    type: 'website',
    images: [{ url: 'https://www.tradvue.com/og-image.png', width: 1200, height: 630, alt: 'TradVue Trading Rules' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Trading Rules | TradVue',
    description: 'Define and track your personal trading rules.',
    images: ['/og-image.png'],
  },
}

export default function RulesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
