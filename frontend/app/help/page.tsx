/**
 * Help page — Server Component
 *
 * Static content with an interactive FAQ search/accordion — the interactive
 * parts live in HelpClient.tsx ('use client').
 * This wrapper gives Next.js a proper server-rendered entry point for SEO.
 */
import type { Metadata } from 'next'
import HelpClient from './HelpClient'

export const metadata: Metadata = {
  title: 'Help & Support — FAQs, Guides & Troubleshooting | TradVue',
  description:
    'Find answers to common questions about TradVue: trading journal setup, portfolio tracking, price alerts, calculators, CSV import, prop firm tracking, and more.',
  alternates: { canonical: 'https://www.tradvue.com/help' },
  openGraph: {
    title: 'Help & Support | TradVue',
    description: 'FAQs, guides and troubleshooting for TradVue trading journal, portfolio tracker, calculators, and more.',
    url: 'https://www.tradvue.com/help',
    type: 'website',
    images: [{ url: 'https://www.tradvue.com/og-image.png', width: 1200, height: 630, alt: 'TradVue Help & Support' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Help & Support | TradVue',
    description: 'FAQs and guides for TradVue trading journal, calculators, and market tools.',
    images: ['/og-image.png'],
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How do I get started with TradVue?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Create a free account at tradvue.com — no credit card required. You get a 3-week full Pro trial from day one. You can immediately start logging trades in the journal, use all 30+ calculators, and set up your watchlist. Dashboard, news, and calendar are accessible without an account.',
          },
        },
        {
          '@type': 'Question',
          name: 'How do I import my existing trades into TradVue?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Go to the Journal page and click the Import button. TradVue accepts CSV files from most major brokers. Free accounts can import trades from the last 30 days; Pro accounts have no date restrictions.',
          },
        },
        {
          '@type': 'Question',
          name: 'How do I set up prop firm tracking?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Go to the Prop Firm Tracker page, click "Add Account," and enter your firm rules (daily loss limit, max drawdown, trailing loss). TradVue will track your compliance automatically as you log trades.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is the difference between Free and Pro?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Free accounts get unlimited trade logging with a 30-day window, all calculators, basic analytics, and 3 price alerts. Pro adds unlimited history, cloud sync, advanced analytics, AI analysis, unlimited alerts, and priority support.',
          },
        },
        {
          '@type': 'Question',
          name: 'How do I cancel my TradVue Pro subscription?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Go to Account Settings and click "Manage Subscription." You will be taken to the Stripe billing portal where you can cancel at any time. Your Pro access continues until the end of the current billing period.',
          },
        },
      ],
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.tradvue.com' },
        { '@type': 'ListItem', position: 2, name: 'Help & Support', item: 'https://www.tradvue.com/help' },
      ],
    },
  ],
}

export default function HelpPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HelpClient />
    </>
  )
}
