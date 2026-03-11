import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Economic Calendar — TradVue',
  description:
    'Track high-impact economic events, earnings releases, Fed speeches, and market holidays. Plan your trades around key macro catalysts.',
  openGraph: {
    title: 'Economic Calendar — TradVue',
    description:
      'Track high-impact economic events, earnings releases, Fed speeches, and market holidays.',
    url: 'https://www.tradvue.com/calendar',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Economic Calendar — TradVue',
    description:
      'Track economic events, earnings, Fed speeches, and market holidays. Plan your trades around key macro catalysts.',
  },
  alternates: {
    canonical: 'https://www.tradvue.com/calendar',
  },
}

export default function CalendarLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
