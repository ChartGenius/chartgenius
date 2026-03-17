import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Market News — Real-Time Financial News with AI Sentiment',
  description:
    'Stay ahead of the market with real-time financial news and AI sentiment analysis. Stocks, crypto, forex, and commodities. Free to read — create a free account, no credit card required.',
  openGraph: {
    title: 'Market News — Real-Time Financial News with AI Sentiment | TradVue',
    description:
      'Real-time market news with AI-powered sentiment analysis across stocks, crypto, forex, and commodities. Free to read.',
    url: 'https://www.tradvue.com/news',
    type: 'website',
    images: [{ url: 'https://www.tradvue.com/og-image.png', width: 1200, height: 630, alt: 'TradVue Market News' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Market News — Real-Time Financial News with AI Sentiment | TradVue',
    description:
      'Real-time market news with AI sentiment analysis. Stay ahead of market-moving events.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: 'https://www.tradvue.com/news',
  },
}

// ─── JSON-LD for News page ────────────────────────────────────────────────────

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': 'https://www.tradvue.com/news',
      url: 'https://www.tradvue.com/news',
      name: 'Market News — TradVue',
      description:
        'Real-time financial news with AI-powered sentiment analysis covering stocks, crypto, forex, and commodities.',
      about: {
        '@type': 'Thing',
        name: 'Financial News',
        description: 'Market-moving financial news for traders and investors.',
      },
      isPartOf: { '@id': 'https://www.tradvue.com/#website' },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.tradvue.com' },
        { '@type': 'ListItem', position: 2, name: 'Market News', item: 'https://www.tradvue.com/news' },
      ],
    },
  ],
}

export default function NewsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  )
}
