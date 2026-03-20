// ─── Shared types used across HomeClient components ───────────────────────────

export interface Quote {
  symbol: string
  current: number
  change: number
  changePct: number
  high: number
  low: number
  open: number
  prevClose: number
  timestamp: string
  source: 'finnhub' | 'alpaca' | 'mock'
}

export interface CalendarEvent {
  id: string
  title: string
  currency: string
  country?: string
  impact: number | string // supports both legacy numeric (1/2/3) and new string ('Low'/'Medium'/'High')
  type?: 'economic' | 'earnings' | 'speech' | 'holiday'
  symbol?: string // for earnings events
  datetime?: string
  date?: string
  actual: string | null
  forecast: string | null
  previous: string | null
  source: string
}

export interface MarketStatus {
  exchange: string
  isOpen: boolean
  session?: string
  source: string
}

export interface CryptoCoin {
  id: string
  symbol: string
  name: string
  price: number
  change24h: number
  change7d: number
  marketCap: number
  volume24h: number
  marketCapRank: number
  image: string | null
}

export interface NewsArticle {
  id: string
  title: string
  summary: string
  url: string | null
  source: string
  category: string
  publishedAt: string
  sentimentScore: number
  sentimentLabel: 'bullish' | 'bearish' | 'neutral'
  impactScore: number
  impactLabel: 'High' | 'Medium' | 'Low'
  tags: string[]
  symbols: string[]
  imageUrl: string | null
}

export interface CompanyProfile {
  symbol: string
  name: string
  description: string | null
  exchange: string
  industry: string
  sector: string
  country: string
  currency: string
  marketCap: number | null
  website: string | null
  logo: string | null
  ipo: string | null
  peRatio: number | null
  pbRatio: number | null
  eps: number | null
  dividendYield: number | null
  week52High: number | null
  week52Low: number | null
  beta: number | null
}

export interface PortfolioPosition {
  symbol: string
  name: string
  shares: number
  buyPrice: number
  buyDate: string
}
