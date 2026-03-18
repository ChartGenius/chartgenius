import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'TradVue Pro Pricing — Monthly $24 or Annual $201.60',
  description:
    'Upgrade to TradVue Pro for unlimited trade history, AI analytics, cloud sync, and priority support. Monthly $24 or save 30% with annual billing at $201.60/yr.',
  openGraph: {
    title: 'TradVue Pro Pricing — Monthly $24 or Annual $201.60',
    description:
      'Upgrade to TradVue Pro. Monthly $24 or save 30% annual $201.60/yr. Unlimited history, AI analytics, prop firm sync. 21-day free trial, no credit card required.',
    url: 'https://www.tradvue.com/pricing',
    type: 'website',
    images: [{ url: 'https://www.tradvue.com/og-image.png', width: 1200, height: 630, alt: 'TradVue Pro Pricing' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TradVue Pro Pricing — Monthly $24 or Annual $201.60',
    description:
      'Upgrade to TradVue Pro. Monthly $24 or save 30% with annual billing. 21-day free trial.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: 'https://www.tradvue.com/pricing',
  },
}

// ─── JSON-LD for Pricing page ─────────────────────────────────────────────────

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Product',
      name: 'TradVue Pro',
      description:
        'Full-featured trading journal with unlimited history, AI-powered analytics, prop firm tracking, cloud sync, and priority support.',
      url: 'https://www.tradvue.com/pricing',
      brand: {
        '@type': 'Brand',
        name: 'TradVue',
      },
      offers: [
        {
          '@type': 'Offer',
          name: 'TradVue Pro — Monthly',
          price: '24.00',
          priceCurrency: 'USD',
          priceSpecification: {
            '@type': 'UnitPriceSpecification',
            price: '24.00',
            priceCurrency: 'USD',
            billingIncrement: 1,
            unitCode: 'MON',
          },
          availability: 'https://schema.org/InStock',
          url: 'https://www.tradvue.com/pricing',
          seller: { '@type': 'Organization', name: 'TradVue' },
        },
        {
          '@type': 'Offer',
          name: 'TradVue Pro — Annual',
          price: '201.60',
          priceCurrency: 'USD',
          priceSpecification: {
            '@type': 'UnitPriceSpecification',
            price: '201.60',
            priceCurrency: 'USD',
            billingIncrement: 1,
            unitCode: 'ANN',
          },
          availability: 'https://schema.org/InStock',
          url: 'https://www.tradvue.com/pricing',
          seller: { '@type': 'Organization', name: 'TradVue' },
        },
      ],
      featureList: [
        'Unlimited trade journal history',
        'Cloud auto-sync across all devices',
        'Full CSV import/export — no date restrictions',
        'Advanced analytics & reports',
        'Unlimited portfolio positions',
        'Unlimited price alerts',
        'Priority support & early feature access',
        'Secure Stripe billing — cancel anytime',
      ],
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.tradvue.com' },
        { '@type': 'ListItem', position: 2, name: 'Pricing', item: 'https://www.tradvue.com/pricing' },
      ],
    },
  ],
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
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
