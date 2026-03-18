import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Economic Calendar — Track Earnings, Fed Events & Macro Catalysts',
  description:
    'Track high-impact economic events, earnings releases, Fed speeches, and market holidays. Plan your trades around key macro catalysts. Free to use.',
  openGraph: {
    title: 'Economic Calendar — Track Earnings, Fed Events & Macro Catalysts | TradVue',
    description:
      'Track high-impact economic events, earnings releases, Fed speeches, and market holidays. Free.',
    url: 'https://www.tradvue.com/calendar',
    type: 'website',
    images: [{ url: 'https://www.tradvue.com/og-image.png', width: 1200, height: 630, alt: 'TradVue Economic Calendar' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Economic Calendar | TradVue',
    description:
      'Track economic events, earnings, Fed speeches, and market holidays. Plan around key catalysts.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: 'https://www.tradvue.com/calendar',
  },
}

export default function CalendarLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
