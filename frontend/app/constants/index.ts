// ─── Shared constants used across HomeClient components ───────────────────────

/** Sidebar symbols for fetching quotes used in Analysis view gainers/losers */
export const SIDEBAR_SYMBOLS = ['SPY', 'QQQ', 'DIA', 'GLD', 'SLV', 'AAPL', 'MSFT', 'NVDA']

/** Default watchlist symbols (pre-populated for new users) */
export const DEFAULT_WATCHLIST = [
  'SPY', 'QQQ', 'DIA', 'IWM',
  'AAPL', 'GOOGL', 'TSLA', 'MSFT', 'META', 'NVDA', 'AMZN',
  'GLD', 'SLV',
  'BTC', 'ETH',
  'EURUSD', 'GBPUSD',
  'VIX',
]

export const TICKER_SYMBOLS = ['SPY', 'QQQ', 'DIA', 'BTC-USD', 'ETH-USD', 'EURUSD', 'GBPUSD', 'GC=F', 'CL=F', 'VIX']

export const TICKER_DISPLAY: Record<string, string> = {
  'SPY':     'S&P 500',
  'QQQ':     'NASDAQ',
  'DIA':     'DOW',
  'BTC-USD': 'BTC/USD',
  'ETH-USD': 'ETH/USD',
  'EURUSD':  'EUR/USD',
  'GBPUSD':  'GBP/USD',
  'GC=F':    'GOLD',
  'CL=F':    'CRUDE',
  'VIX':     'VIX',
}

export const TICKER_FALLBACK = [
  { symbol: 'S&P 500', price: 5234.18, change: 0.42 },
  { symbol: 'NASDAQ',  price: 16432.90, change: 0.68 },
  { symbol: 'DOW',     price: 38996.39, change: 0.18 },
  { symbol: 'BTC/USD', price: 67420.50, change: -1.23 },
  { symbol: 'ETH/USD', price: 3512.80,  change: 2.14 },
  { symbol: 'EUR/USD', price: 1.0852,   change: -0.08 },
  { symbol: 'GBP/USD', price: 1.2634,   change: 0.12 },
  { symbol: 'GOLD',    price: 2312.40,  change: 0.31 },
  { symbol: 'CRUDE',   price: 83.72,    change: -0.55 },
  { symbol: 'VIX',     price: 14.32,    change: -3.21 },
]

export const NEWS_CATEGORIES = ['All', 'Equities', 'Forex', 'Crypto', 'Commodities', 'Macro']

export const NEWS_CAT_MAP: Record<string, string> = {
  All: 'all',
  Equities: 'stocks',
  Forex: 'forex',
  Crypto: 'crypto',
  Commodities: 'commodities',
  Macro: 'economy',
}

export const NEWS_ARTICLE_COUNTS = [5, 10, 25, 50]

export const CALENDAR_IMPACT_FILTERS = ['All', 'High', 'Medium', 'Low']
export const CALENDAR_CURRENCIES = ['All', 'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'NZD']

/** Major-cap earnings filter — dashboard widget shows ONLY these symbols */
export const MAJOR_CAP_SYMBOLS = new Set([
  'AAPL','MSFT','NVDA','GOOGL','GOOG','AMZN','META','TSLA','NFLX',
  'AMD','INTC','QCOM','AVGO','TXN','ORCL','CRM','ADBE','SNOW','PLTR',
  'V','MA','JPM','BAC','GS','MS','WFC','C','SCHW',
  'JNJ','UNH','PFE','MRK','ABBV','LLY','BMY',
  'WMT','COST','TGT','HD','SBUX','NKE','MCD',
  'XOM','CVX','COP','OXY',
  'BRK.A','BRK.B',
  'DIS','CMCSA','NFLX','SPOT',
  'T','VZ',
  'BA','RTX','LMT','GE',
  'COIN','HOOD','ROBINHOOD',
  'SPY','QQQ','IWM',
])

export const MAX_TICKER_CUSTOM = 15

/** Top symbols for autocomplete */
export const TOP_SYMBOLS = [
  { symbol: 'AAPL',  name: 'Apple Inc.' },
  { symbol: 'MSFT',  name: 'Microsoft Corporation' },
  { symbol: 'NVDA',  name: 'NVIDIA Corporation' },
  { symbol: 'GOOGL', name: 'Alphabet Inc. (Class A)' },
  { symbol: 'GOOG',  name: 'Alphabet Inc. (Class C)' },
  { symbol: 'AMZN',  name: 'Amazon.com Inc.' },
  { symbol: 'META',  name: 'Meta Platforms Inc.' },
  { symbol: 'TSLA',  name: 'Tesla Inc.' },
  { symbol: 'AVGO',  name: 'Broadcom Inc.' },
  { symbol: 'LLY',   name: 'Eli Lilly and Company' },
  { symbol: 'JPM',   name: 'JPMorgan Chase & Co.' },
  { symbol: 'V',     name: 'Visa Inc.' },
  { symbol: 'UNH',   name: 'UnitedHealth Group' },
  { symbol: 'XOM',   name: 'ExxonMobil Corporation' },
  { symbol: 'MA',    name: 'Mastercard Inc.' },
  { symbol: 'JNJ',   name: 'Johnson & Johnson' },
  { symbol: 'PG',    name: 'Procter & Gamble' },
  { symbol: 'HD',    name: 'Home Depot Inc.' },
  { symbol: 'MRK',   name: 'Merck & Co.' },
  { symbol: 'COST',  name: 'Costco Wholesale Corporation' },
  { symbol: 'ABBV',  name: 'AbbVie Inc.' },
  { symbol: 'CVX',   name: 'Chevron Corporation' },
  { symbol: 'CRM',   name: 'Salesforce Inc.' },
  { symbol: 'KO',    name: 'Coca-Cola Company' },
  { symbol: 'BAC',   name: 'Bank of America Corp.' },
  { symbol: 'PEP',   name: 'PepsiCo Inc.' },
  { symbol: 'AMD',   name: 'Advanced Micro Devices' },
  { symbol: 'NFLX',  name: 'Netflix Inc.' },
  { symbol: 'TMO',   name: 'Thermo Fisher Scientific' },
  { symbol: 'DIS',   name: 'Walt Disney Company' },
  { symbol: 'ADBE',  name: 'Adobe Inc.' },
  { symbol: 'MCD',   name: "McDonald's Corporation" },
  { symbol: 'WMT',   name: 'Walmart Inc.' },
  { symbol: 'CSCO',  name: 'Cisco Systems Inc.' },
  { symbol: 'ORCL',  name: 'Oracle Corporation' },
  { symbol: 'QCOM',  name: 'Qualcomm Inc.' },
  { symbol: 'PFE',   name: 'Pfizer Inc.' },
  { symbol: 'ACN',   name: 'Accenture plc' },
  { symbol: 'IBM',   name: 'International Business Machines' },
  { symbol: 'INTC',  name: 'Intel Corporation' },
  { symbol: 'INTU',  name: 'Intuit Inc.' },
  { symbol: 'NOW',   name: 'ServiceNow Inc.' },
  { symbol: 'TXN',   name: 'Texas Instruments' },
  { symbol: 'AMAT',  name: 'Applied Materials Inc.' },
  { symbol: 'HON',   name: 'Honeywell International' },
  { symbol: 'BKNG',  name: 'Booking Holdings Inc.' },
  { symbol: 'ISRG',  name: 'Intuitive Surgical Inc.' },
  { symbol: 'UPS',   name: 'United Parcel Service' },
  { symbol: 'GS',    name: 'Goldman Sachs Group' },
  { symbol: 'SBUX',  name: 'Starbucks Corporation' },
  { symbol: 'CAT',   name: 'Caterpillar Inc.' },
  { symbol: 'T',     name: 'AT&T Inc.' },
  { symbol: 'AMGN',  name: 'Amgen Inc.' },
  { symbol: 'LRCX',  name: 'Lam Research Corporation' },
  { symbol: 'C',     name: 'Citigroup Inc.' },
  { symbol: 'MS',    name: 'Morgan Stanley' },
  { symbol: 'DE',    name: 'Deere & Company' },
  { symbol: 'MDT',   name: 'Medtronic plc' },
  { symbol: 'RTX',   name: 'RTX Corporation' },
  { symbol: 'PYPL',  name: 'PayPal Holdings Inc.' },
  { symbol: 'MRNA',  name: 'Moderna Inc.' },
  { symbol: 'COIN',  name: 'Coinbase Global Inc.' },
  { symbol: 'HOOD',  name: 'Robinhood Markets Inc.' },
  { symbol: 'SOFI',  name: 'SoFi Technologies Inc.' },
  { symbol: 'PLTR',  name: 'Palantir Technologies' },
  { symbol: 'SNOW',  name: 'Snowflake Inc.' },
  { symbol: 'DDOG',  name: 'Datadog Inc.' },
  { symbol: 'CRWD',  name: 'CrowdStrike Holdings' },
  { symbol: 'PANW',  name: 'Palo Alto Networks' },
  { symbol: 'NET',   name: 'Cloudflare Inc.' },
  { symbol: 'UBER',  name: 'Uber Technologies' },
  { symbol: 'ABNB',  name: 'Airbnb Inc.' },
  { symbol: 'RIVN',  name: 'Rivian Automotive Inc.' },
  { symbol: 'NIO',   name: 'NIO Inc.' },
  { symbol: 'BABA',  name: 'Alibaba Group Holding' },
  { symbol: 'PATH',  name: 'UiPath Inc.' },
  { symbol: 'SPY',   name: 'SPDR S&P 500 ETF Trust' },
  { symbol: 'QQQ',   name: 'Invesco QQQ Trust' },
  { symbol: 'DIA',   name: 'SPDR Dow Jones ETF' },
  { symbol: 'IWM',   name: 'iShares Russell 2000 ETF' },
  { symbol: 'GLD',   name: 'SPDR Gold Shares ETF' },
  { symbol: 'SLV',   name: 'iShares Silver Trust ETF' },
  { symbol: 'TLT',   name: 'iShares 20+ Yr Treasury ETF' },
  { symbol: 'XLF',   name: 'Financial Select SPDR ETF' },
  { symbol: 'XLE',   name: 'Energy Select SPDR ETF' },
  { symbol: 'XLK',   name: 'Technology Select SPDR ETF' },
  { symbol: 'ARKK',  name: 'ARK Innovation ETF' },
  { symbol: 'VOO',   name: 'Vanguard S&P 500 ETF' },
  { symbol: 'BRK.B', name: 'Berkshire Hathaway Class B' },
]

/** Crypto symbol map (for watchlist display) */
export const CRYPTO_SYMBOL_MAP: Record<string, string> = {
  'BTC': 'BTC',
  'ETH': 'ETH',
  'SOL': 'SOL',
  'ADA': 'ADA',
  'DOGE': 'DOGE',
  'XRP': 'XRP',
  'BNB': 'BNB',
  'AVAX': 'AVAX',
  'DOT': 'DOT',
  'MATIC': 'MATIC',
}

/** Watchlist quote cache key + TTL */
export const WL_CACHE_KEY = 'tv_wl_quotes_v1'
export const WL_CACHE_TTL = 60_000

/** Look up a symbol's full name from TOP_SYMBOLS, fallback to the symbol itself */
export function symbolName(sym: string): string {
  return TOP_SYMBOLS.find(s => s.symbol === sym)?.name || sym
}

/** Returns which symbols in the watchlist should go to the stock batch endpoint */
export function stockSymbolsFromWatchlist(wl: string[]): string[] {
  return wl.filter(s => !CRYPTO_SYMBOL_MAP[s.toUpperCase()])
}
