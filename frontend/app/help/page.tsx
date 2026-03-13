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
  title: 'Help & Support | TradVue',
  description:
    'Find answers to common questions about TradVue — trading journal, portfolio tracker, calculators, alerts, and more. Browse by category or search below.',
  alternates: { canonical: 'https://www.tradvue.com/help' },
}

export default function HelpPage() {
  return <HelpClient />
}
