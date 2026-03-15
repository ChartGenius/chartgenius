// ─── Futures Contract Specifications ─────────────────────────────────────────
// Covers the 17 most popular futures contracts for retail/prop traders.
// All tick values in USD. Used by the journal to auto-populate contract data.

export interface FuturesContractSpec {
  symbol: string
  name: string
  exchange: string
  tickSize: number      // Minimum price increment
  tickValue: number     // USD value per tick per contract
  pointValue: number    // USD value per full point (1.00) per contract
  tradingHours: string  // Human-readable trading hours
  contractMonths: string // Active contract months
}

export const FUTURES_CONTRACTS: Record<string, FuturesContractSpec> = {
  ES: {
    symbol: 'ES',
    name: 'E-mini S&P 500',
    exchange: 'CME',
    tickSize: 0.25,
    tickValue: 12.50,
    pointValue: 50,
    tradingHours: 'Sun–Fri 6:00 PM – 5:00 PM ET (23h/day)',
    contractMonths: 'H (Mar), M (Jun), U (Sep), Z (Dec)',
  },
  NQ: {
    symbol: 'NQ',
    name: 'E-mini Nasdaq-100',
    exchange: 'CME',
    tickSize: 0.25,
    tickValue: 5.00,
    pointValue: 20,
    tradingHours: 'Sun–Fri 6:00 PM – 5:00 PM ET (23h/day)',
    contractMonths: 'H (Mar), M (Jun), U (Sep), Z (Dec)',
  },
  MES: {
    symbol: 'MES',
    name: 'Micro E-mini S&P 500',
    exchange: 'CME',
    tickSize: 0.25,
    tickValue: 1.25,
    pointValue: 5,
    tradingHours: 'Sun–Fri 6:00 PM – 5:00 PM ET (23h/day)',
    contractMonths: 'H (Mar), M (Jun), U (Sep), Z (Dec)',
  },
  MNQ: {
    symbol: 'MNQ',
    name: 'Micro E-mini Nasdaq-100',
    exchange: 'CME',
    tickSize: 0.25,
    tickValue: 0.50,
    pointValue: 2,
    tradingHours: 'Sun–Fri 6:00 PM – 5:00 PM ET (23h/day)',
    contractMonths: 'H (Mar), M (Jun), U (Sep), Z (Dec)',
  },
  CL: {
    symbol: 'CL',
    name: 'Crude Oil (WTI)',
    exchange: 'NYMEX',
    tickSize: 0.01,
    tickValue: 10.00,
    pointValue: 1000,
    tradingHours: 'Sun–Fri 6:00 PM – 5:00 PM ET (23h/day)',
    contractMonths: 'All 12 calendar months',
  },
  GC: {
    symbol: 'GC',
    name: 'Gold',
    exchange: 'COMEX',
    tickSize: 0.10,
    tickValue: 10.00,
    pointValue: 100,
    tradingHours: 'Sun–Fri 6:00 PM – 5:00 PM ET (23h/day)',
    contractMonths: 'G (Feb), J (Apr), M (Jun), Q (Aug), V (Oct), Z (Dec)',
  },
  SI: {
    symbol: 'SI',
    name: 'Silver',
    exchange: 'COMEX',
    tickSize: 0.005,
    tickValue: 25.00,
    pointValue: 5000,
    tradingHours: 'Sun–Fri 6:00 PM – 5:00 PM ET (23h/day)',
    contractMonths: 'H (Mar), K (May), N (Jul), U (Sep), Z (Dec)',
  },
  ZB: {
    symbol: 'ZB',
    name: '30-Year T-Bond',
    exchange: 'CBOT',
    tickSize: 0.03125,    // 1/32 of a point
    tickValue: 31.25,
    pointValue: 1000,
    tradingHours: 'Sun–Fri 6:00 PM – 5:00 PM ET (23h/day)',
    contractMonths: 'H (Mar), M (Jun), U (Sep), Z (Dec)',
  },
  RTY: {
    symbol: 'RTY',
    name: 'E-mini Russell 2000',
    exchange: 'CME',
    tickSize: 0.10,
    tickValue: 5.00,
    pointValue: 50,
    tradingHours: 'Sun–Fri 6:00 PM – 5:00 PM ET (23h/day)',
    contractMonths: 'H (Mar), M (Jun), U (Sep), Z (Dec)',
  },
  YM: {
    symbol: 'YM',
    name: 'E-mini Dow Jones',
    exchange: 'CBOT',
    tickSize: 1,
    tickValue: 5.00,
    pointValue: 5,
    tradingHours: 'Sun–Fri 6:00 PM – 5:00 PM ET (23h/day)',
    contractMonths: 'H (Mar), M (Jun), U (Sep), Z (Dec)',
  },
  HG: {
    symbol: 'HG',
    name: 'Copper',
    exchange: 'COMEX',
    tickSize: 0.0005,
    tickValue: 12.50,
    pointValue: 25000,
    tradingHours: 'Sun–Fri 6:00 PM – 5:00 PM ET (23h/day)',
    contractMonths: 'H (Mar), K (May), N (Jul), U (Sep), Z (Dec)',
  },
  NG: {
    symbol: 'NG',
    name: 'Natural Gas',
    exchange: 'NYMEX',
    tickSize: 0.001,
    tickValue: 10.00,
    pointValue: 10000,
    tradingHours: 'Sun–Fri 6:00 PM – 5:00 PM ET (23h/day)',
    contractMonths: 'All 12 calendar months',
  },
  ZC: {
    symbol: 'ZC',
    name: 'Corn',
    exchange: 'CBOT',
    tickSize: 0.25,       // 1/4 cent per bushel
    tickValue: 12.50,
    pointValue: 50,
    tradingHours: 'Mon–Fri 8:30 AM – 1:20 PM CT (Day session)',
    contractMonths: 'H (Mar), K (May), N (Jul), U (Sep), Z (Dec)',
  },
  ZS: {
    symbol: 'ZS',
    name: 'Soybeans',
    exchange: 'CBOT',
    tickSize: 0.25,
    tickValue: 12.50,
    pointValue: 50,
    tradingHours: 'Mon–Fri 8:30 AM – 1:15 PM CT (Day session)',
    contractMonths: 'F (Jan), H (Mar), K (May), N (Jul), Q (Aug), U (Sep), X (Nov)',
  },
  ZW: {
    symbol: 'ZW',
    name: 'Wheat (SRW)',
    exchange: 'CBOT',
    tickSize: 0.25,
    tickValue: 12.50,
    pointValue: 50,
    tradingHours: 'Mon–Fri 8:30 AM – 1:15 PM CT (Day session)',
    contractMonths: 'H (Mar), K (May), N (Jul), U (Sep), Z (Dec)',
  },
  '6E': {
    symbol: '6E',
    name: 'Euro FX',
    exchange: 'CME',
    tickSize: 0.00005,
    tickValue: 6.25,
    pointValue: 125000,
    tradingHours: 'Sun–Fri 6:00 PM – 5:00 PM ET (23h/day)',
    contractMonths: 'H (Mar), M (Jun), U (Sep), Z (Dec)',
  },
  '6J': {
    symbol: '6J',
    name: 'Japanese Yen',
    exchange: 'CME',
    tickSize: 0.0000005,
    tickValue: 6.25,
    pointValue: 12500000,
    tradingHours: 'Sun–Fri 6:00 PM – 5:00 PM ET (23h/day)',
    contractMonths: 'H (Mar), M (Jun), U (Sep), Z (Dec)',
  },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Look up contract spec by symbol. Strips common month/year suffixes (e.g. ESH26 → ES).
 */
export function getContractSpec(symbol: string): FuturesContractSpec | null {
  if (!symbol) return null
  const s = symbol.toUpperCase().trim()
  // Try exact match first
  if (FUTURES_CONTRACTS[s]) return FUTURES_CONTRACTS[s]
  // Strip month+year suffix (e.g. ESH26, NQM5)
  const base = s.replace(/[FGHJKMNQUVXZ]\d{1,2}$/, '')
  return FUTURES_CONTRACTS[base] || null
}

/**
 * Calculate dollar P&L from tick count.
 * @param symbol  Contract symbol (e.g. 'ES', 'NQ', 'MES')
 * @param ticks   Number of ticks gained (+) or lost (-)
 * @param contracts Number of contracts
 */
export function calculatePnlFromTicks(symbol: string, ticks: number, contracts: number): number {
  const spec = getContractSpec(symbol)
  if (!spec || contracts === 0) return 0
  return ticks * spec.tickValue * contracts
}

/**
 * Calculate P&L in ticks from entry/exit prices and direction.
 * Returns a signed tick count (positive = profit, negative = loss).
 */
export function calculateTicksFromPrices(
  symbol: string,
  entryPrice: number,
  exitPrice: number,
  direction: 'Long' | 'Short',
): number {
  const spec = getContractSpec(symbol)
  if (!spec || spec.tickSize === 0) return 0
  const priceDiff = direction === 'Long'
    ? exitPrice - entryPrice
    : entryPrice - exitPrice
  return Math.round((priceDiff / spec.tickSize) * 1e6) / 1e6  // avoid floating point drift
}

/**
 * Calculate dollar P&L from entry/exit prices (contracts-aware).
 */
export function calculateFuturesPnl(
  symbol: string,
  entryPrice: number,
  exitPrice: number,
  direction: 'Long' | 'Short',
  numContracts: number,
): number {
  const ticks = calculateTicksFromPrices(symbol, entryPrice, exitPrice, direction)
  return calculatePnlFromTicks(symbol, ticks, numContracts)
}

/** Sorted list of symbols for dropdowns. */
export const FUTURES_SYMBOLS_LIST = Object.keys(FUTURES_CONTRACTS).sort()
