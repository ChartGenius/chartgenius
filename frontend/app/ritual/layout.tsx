import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Post-Trade Ritual App — Daily Trading Journal Habit Tracker',
  description:
    'Build a daily trading journal habit with TradVue\'s post-trade ritual app. Track emotions, build streaks, and log every trade in 60 seconds. Free to use.',
  alternates: {
    canonical: 'https://www.tradvue.com/ritual',
  },
  openGraph: {
    title: 'Post-Trade Ritual App | TradVue',
    description: 'Daily trading journal habit tracker with emotion tags and streak building.',
    url: 'https://www.tradvue.com/ritual',
    type: 'website',
    images: [{ url: 'https://www.tradvue.com/og-image.png', width: 1200, height: 630, alt: 'TradVue Post-Trade Ritual App' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Post-Trade Ritual App | TradVue',
    description: 'Daily trading journal habit tracker. Log trades in 60 seconds. Free.',
    images: ['/og-image.png'],
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      url: 'https://www.tradvue.com/ritual',
      name: 'Post-Trade Ritual — TradVue',
      description: 'Daily trading journal habit app with 60-second logging, emotion tracking, and streak building.',
      isPartOf: { '@id': 'https://www.tradvue.com/#website' },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.tradvue.com' },
        { '@type': 'ListItem', position: 2, name: 'Post-Trade Ritual', item: 'https://www.tradvue.com/ritual' },
      ],
    },
  ],
}

export default function RitualLayout({ children }: { children: React.ReactNode }) {
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
