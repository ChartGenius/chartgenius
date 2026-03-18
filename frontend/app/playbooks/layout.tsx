import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Trading Playbooks — Save & Reuse Your Best Setups',
  description:
    'Build and manage your trading playbooks in TradVue. Save your best trade setups, entry rules, and strategies. Apply them consistently for better results.',
  alternates: { canonical: 'https://www.tradvue.com/playbooks' },
  openGraph: {
    title: 'Trading Playbooks | TradVue',
    description: 'Save and manage your best trade setups and strategies as playbooks.',
    url: 'https://www.tradvue.com/playbooks',
    type: 'website',
    images: [{ url: 'https://www.tradvue.com/og-image.png', width: 1200, height: 630, alt: 'TradVue Trading Playbooks' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Trading Playbooks | TradVue',
    description: 'Save your best trading setups and apply them consistently.',
    images: ['/og-image.png'],
  },
}

export default function PlaybooksLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
