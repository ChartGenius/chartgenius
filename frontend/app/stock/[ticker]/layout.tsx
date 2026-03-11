import type { Metadata } from 'next'

type Props = {
  params: Promise<{ ticker: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ticker } = await params
  const symbol = ticker.toUpperCase()

  return {
    title: `${symbol} Stock Analysis — TradVue`,
    description: `Real-time price, charts, financials, and AI-powered analysis for ${symbol}. Track ${symbol} performance, key metrics, and market news.`,
    openGraph: {
      title: `${symbol} Stock Analysis — TradVue`,
      description: `Real-time price, charts, financials, and AI-powered analysis for ${symbol}.`,
      url: `https://www.tradvue.com/stock/${ticker}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${symbol} Stock Analysis — TradVue`,
      description: `Real-time price, charts, and analysis for ${symbol}.`,
    },
    alternates: {
      canonical: `https://www.tradvue.com/stock/${ticker}`,
    },
  }
}

export default function StockLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
