/**
 * FRED Economic Data Service (Federal Reserve Bank of St. Louis)
 *
 * Fetches key macroeconomic indicators from the FRED API.
 * Free API key: https://fred.stlouisfed.org/docs/api/api_key.html
 *
 * Requires env var: FRED_API_KEY
 * If not set, returns "coming soon" responses — does NOT crash.
 *
 * Cache: 1 hour (FRED data updates slowly — daily/weekly/quarterly)
 */

'use strict';

const axios = require('axios');
const cache = require('./cache');

const FRED_BASE = 'https://api.stlouisfed.org/fred';

// ─── Series definitions ───────────────────────────────────────────────────────

const SERIES = [
  { id: 'GDP',      name: 'Gross Domestic Product',    frequency: 'Quarterly', unit: 'Billions USD' },
  { id: 'CPIAUCSL', name: 'CPI (All Urban Consumers)',  frequency: 'Monthly',   unit: 'Index' },
  { id: 'UNRATE',   name: 'Unemployment Rate',          frequency: 'Monthly',   unit: '%' },
  { id: 'FEDFUNDS', name: 'Federal Funds Rate',         frequency: 'Monthly',   unit: '%' },
  { id: 'DGS10',    name: '10-Year Treasury Rate',      frequency: 'Daily',     unit: '%' },
  { id: 'VIXCLS',   name: 'CBOE Volatility Index (VIX)',frequency: 'Daily',     unit: 'Index' },
  { id: 'UMCSENT',  name: 'U. of Mich. Consumer Sentiment', frequency: 'Monthly', unit: 'Index' },
  { id: 'ICSA',     name: 'Initial Jobless Claims',     frequency: 'Weekly',    unit: 'Thousands' },
];

const SERIES_MAP = Object.fromEntries(SERIES.map(s => [s.id, s]));

// ─── Helper ───────────────────────────────────────────────────────────────────

function _noKeyResponse() {
  return {
    available: false,
    message: 'FRED economic data coming soon. Configure FRED_API_KEY to enable.',
    indicators: SERIES.map(s => ({
      seriesId: s.id,
      name: s.name,
      frequency: s.frequency,
      unit: s.unit,
      value: null,
      date: null,
      previousValue: null,
      change: null,
      changePercent: null,
      trend: [],
      available: false,
    })),
  };
}

// ─── Core ─────────────────────────────────────────────────────────────────────

/**
 * Fetch observations for a single FRED series (last 12 data points).
 */
async function _fetchSeries(seriesId, apiKey) {
  const cacheKey = `fred:series:${seriesId}`;

  return cache.cacheAPICall(cacheKey, async () => {
    try {
      const response = await axios.get(`${FRED_BASE}/series/observations`, {
        params: {
          series_id: seriesId,
          api_key: apiKey,
          file_type: 'json',
          sort_order: 'desc',
          limit: 12,
        },
        timeout: 12000,
      });

      const observations = (response.data?.observations || [])
        .filter(obs => obs.value !== '.' && obs.value != null)
        .map(obs => ({
          date: obs.date,
          value: parseFloat(obs.value),
        }));

      if (observations.length === 0) {
        return null;
      }

      // Sorted desc — index 0 = latest, index 1 = previous
      const latest = observations[0];
      const previous = observations[1] || null;
      const change = previous ? parseFloat((latest.value - previous.value).toFixed(4)) : null;
      const changePercent = previous && previous.value !== 0
        ? parseFloat(((change / Math.abs(previous.value)) * 100).toFixed(2))
        : null;

      const meta = SERIES_MAP[seriesId] || { name: seriesId, frequency: 'Unknown', unit: '' };

      return {
        seriesId,
        name: meta.name,
        frequency: meta.frequency,
        unit: meta.unit,
        value: latest.value,
        date: latest.date,
        previousValue: previous ? previous.value : null,
        change,
        changePercent,
        // Trend: oldest → newest (reversed so it's chronological for sparklines)
        trend: [...observations].reverse().map(o => ({ date: o.date, value: o.value })),
        available: true,
      };
    } catch (err) {
      console.error(`[FRED] Error fetching ${seriesId}:`, err.message);
      const meta = SERIES_MAP[seriesId] || { name: seriesId, frequency: 'Unknown', unit: '' };
      return {
        seriesId,
        name: meta.name,
        frequency: meta.frequency,
        unit: meta.unit,
        value: null,
        date: null,
        previousValue: null,
        change: null,
        changePercent: null,
        trend: [],
        available: false,
        error: err.message,
      };
    }
  }, 60 * 60); // 1 hour cache
}

/**
 * Get all tracked economic indicators.
 * Returns "coming soon" if FRED_API_KEY is not configured.
 */
async function getAllIndicators() {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    return _noKeyResponse();
  }

  const cacheKey = 'fred:all_indicators';

  return cache.cacheAPICall(cacheKey, async () => {
    const results = await Promise.allSettled(
      SERIES.map(s => _fetchSeries(s.id, apiKey))
    );

    const indicators = results.map((r, i) => {
      if (r.status === 'fulfilled' && r.value) return r.value;
      const meta = SERIES[i];
      return {
        seriesId: meta.id,
        name: meta.name,
        frequency: meta.frequency,
        unit: meta.unit,
        value: null,
        date: null,
        previousValue: null,
        change: null,
        changePercent: null,
        trend: [],
        available: false,
      };
    });

    return {
      available: true,
      indicators,
      fetchedAt: new Date().toISOString(),
    };
  }, 60 * 60);
}

/**
 * Get a single indicator by series ID.
 */
async function getIndicator(seriesId) {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    const meta = SERIES_MAP[seriesId];
    if (!meta) return null;
    return {
      seriesId,
      name: meta.name,
      frequency: meta.frequency,
      unit: meta.unit,
      value: null,
      date: null,
      previousValue: null,
      change: null,
      changePercent: null,
      trend: [],
      available: false,
      message: 'FRED_API_KEY not configured',
    };
  }

  return _fetchSeries(seriesId, apiKey);
}

module.exports = {
  getAllIndicators,
  getIndicator,
  SERIES,
};
