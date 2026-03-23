import type { Metadata } from 'next'
import { serializeJsonLd } from '../lib/serializeJsonLd'

export const metadata: Metadata = {
  title: 'Prop Firm Account Manager — Track Rules & Compliance',
  description:
    'Manage your prop firm accounts in TradVue. Track drawdown, daily loss limits, trailing loss, and profit targets in real-time. Add multiple accounts. Free to use.',
  alternates: {
    canonical: 'https://www.tradvue.com/propfirm',
  },
  openGraph: {
    title: 'Prop Firm Account Manager | TradVue',
    description: 'Track prop firm rules and compliance: drawdown, daily loss, trailing loss, profit targets. Multiple accounts.',
    url: 'https://www.tradvue.com/propfirm',
    type: 'website',
    images: [{ url: 'https://www.tradvue.com/og-image.png', width: 1200, height: 630, alt: 'TradVue Prop Firm Tracker App' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prop Firm Account Manager | TradVue',
    description: 'Track prop firm compliance: drawdown, daily loss, trailing loss. Free.',
    images: ['/og-image.png'],
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      url: 'https://www.tradvue.com/propfirm',
      name: 'Prop Firm Account Manager — TradVue',
      description: 'Prop firm account management app for tracking rules and compliance in real-time.',
      isPartOf: { '@id': 'https://www.tradvue.com/#website' },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.tradvue.com' },
        { '@type': 'ListItem', position: 2, name: 'Prop Firm Tracker', item: 'https://www.tradvue.com/propfirm' },
      ],
    },
  ],
}

export default function PropFirmLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      {children}
    </>
  )
}
