import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Trading Journal — Track Every Trade with AI Analytics',
  description:
    'Log every trade with TradVue\'s AI-powered trading journal. Analyze patterns, track emotions, measure performance, and build your trading edge. Free to start.',
  openGraph: {
    title: 'Trading Journal — Track Every Trade with AI Analytics | TradVue',
    description:
      'Log and analyze every trade. Track wins, losses, patterns, and progress with AI-powered insights. Free to start.',
    url: 'https://www.tradvue.com/journal',
    type: 'website',
    images: [{ url: 'https://www.tradvue.com/og-image.png', width: 1200, height: 630, alt: 'TradVue Trading Journal' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Trading Journal — Track Every Trade with AI Analytics | TradVue',
    description:
      'Log and analyze every trade. Track wins, losses, and patterns with AI-powered insights. Free to start.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: 'https://www.tradvue.com/journal',
  },
}

// ─── JSON-LD for Journal page ──────────────────────────────────────────────────

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: 'TradVue Trading Journal',
      url: 'https://www.tradvue.com/journal',
      applicationCategory: 'FinanceApplication',
      applicationSubCategory: 'Trading Journal',
      description:
        'AI-powered trading journal for day traders, options traders, futures traders, and prop firm traders. Log trades, track patterns, and build your edge.',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        description: 'Free trading journal, no credit card required.',
      },
      featureList: [
        'AI trade analysis',
        'Emotion tracking',
        'Pattern detection',
        'Prop firm rule monitoring',
        'CSV import/export',
        'Tag system',
        'Weekly summaries',
        'Streak tracking',
      ],
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.tradvue.com' },
        { '@type': 'ListItem', position: 2, name: 'Trading Journal', item: 'https://www.tradvue.com/journal' },
      ],
    },
  ],
}

export default function JournalLayout({ children }: { children: React.ReactNode }) {
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
