import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Trading Tools — TradVue',
  description:
    'Professional trading calculators and tools: position sizing, risk management, options pricing, profit/loss calculator, pivot points, and more.',
  openGraph: {
    title: 'Trading Tools — TradVue',
    description:
      'Professional trading calculators and tools: position sizing, risk management, options pricing, profit/loss calculator, pivot points, and more.',
    url: 'https://www.tradvue.com/tools',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Trading Tools — TradVue',
    description:
      'Professional trading calculators: position sizing, risk management, options pricing, and more.',
  },
  alternates: {
    canonical: 'https://www.tradvue.com/tools',
  },
}

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
