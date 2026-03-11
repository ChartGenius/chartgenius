import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Help & Support — TradVue',
  description:
    'Find answers to common questions about TradVue — account setup, pricing, data sources, alerts, troubleshooting, and more.',
  keywords: [
    'TradVue help',
    'TradVue FAQ',
    'stock market app help',
    'trading platform support',
    'watchlist help',
    'price alerts',
    'TradVue support',
  ],
  openGraph: {
    title: 'Help & Support — TradVue',
    description:
      'Find answers to common questions about TradVue — account setup, pricing, data sources, alerts, troubleshooting, and more.',
    url: 'https://www.tradvue.com/help',
    siteName: 'TradVue',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Help & Support — TradVue',
    description:
      'Answers to common questions about TradVue — accounts, data, alerts, and troubleshooting.',
  },
  alternates: {
    canonical: 'https://www.tradvue.com/help',
  },
}

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
