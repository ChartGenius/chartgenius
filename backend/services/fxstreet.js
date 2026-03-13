/**
 * FXStreet Economic Calendar Service
 *
 * Fetches central bank events, Fed speeches, and rate decisions from FXStreet.
 * Requires FXSTREET_API_KEY env var (Bearer token) — set at call time.
 * Falls back to [] gracefully if API key not set or FXStreet is unavailable.
 *
 * Cache TTL: 12 hours (central bank calendars rarely change intraday).
 */

const axios = require('axios');
const cache = require('./cache');

const CACHE_TTL = 12 * 3600; // 12 hours in seconds

// Currency/country code normalization map
const COUNTRY_MAP = {
  'USD': 'USD', 'EUR': 'EUR', 'GBP': 'GBP', 'JPY': 'JPY',
  'CAD': 'CAD', 'AUD': 'AUD', 'CHF': 'CHF', 'NZD': 'NZD',
  'CNY': 'CNY', 'US': 'USD', 'EU': 'EUR', 'UK': 'GBP',
  'EMU': 'EUR', 'EA': 'EUR',
};

/**
 * Map FXStreet impact values to our standard: 'High' | 'Medium' | 'Low'
 */
function mapImpact(impact) {
  if (impact == null) return 'Low';
  const s = String(impact).toLowerCase();
  if (s === 'high' || s === '3' || s === 'red' || s === 'critical') return 'High';
  if (s === 'medium' || s === 'moderate' || s === '2' || s === 'orange' || s === 'moderate') return 'Medium';
  return 'Low';
}

/**
 * Classify event type based on title keywords.
 * Rate decisions and central bank statements are typed 'speech'.
 */
function classifyType(title) {
  const lower = (title || '').toLowerCase();
  if (
    lower.includes('rate decision') || lower.includes('monetary policy') ||
    lower.includes('interest rate') || lower.includes('cash rate') ||
    lower.includes('bank rate') || lower.includes('refinancing rate') ||
    lower.includes('rate statement') || lower.includes('fomc') ||
    lower.includes('press conference')
  ) return 'speech';

  if (
    lower.includes('speech') || lower.includes('speaks') ||
    lower.includes('testimony') || lower.includes('remarks') ||
    lower.includes('minutes') || lower.includes('forum') ||
    lower.includes('panel') || lower.includes('interview') ||
    lower.includes('hearing') || lower.includes('powell') ||
    lower.includes('lagarde') || lower.includes('bailey') ||
    lower.includes('chair') || lower.includes('governor') ||
    lower.includes('president') || lower.includes('member')
  ) return 'speech';

  return 'economic';
}

/**
 * Fetch events from FXStreet API.
 * Requires FXSTREET_API_KEY env var (read at call time for lazy init).
 *
 * @param {Object} opts
 * @param {string} opts.from - YYYY-MM-DD start date
 * @param {string} opts.to   - YYYY-MM-DD end date
 * @returns {Promise<Array>} Normalized calendar events
 */
async function getEvents({ from, to } = {}) {
  const apiKey = process.env.FXSTREET_API_KEY; // lazy read
  if (!apiKey) {
    // No key configured — skip silently (not an error)
    return [];
  }

  const now = new Date();
  const fromStr = from || now.toISOString().slice(0, 10);
  const toStr   = to   || new Date(now.getTime() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10);

  const CACHE_KEY = `fxstreet:events:${fromStr}:${toStr}`;
  const cached = await cache.get(CACHE_KEY).catch(() => null);
  if (cached) return cached;

  try {
    const url = `https://calendar-api.fxstreet.com/en/api/v1/eventDates/${fromStr}/${toStr}`;
    const { data } = await axios.get(url, {
      timeout: 15000,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'User-Agent': 'TradVue/1.0 (tradvue.com; calendar-bot)',
        'Accept': 'application/json',
      },
    });

    const raw = Array.isArray(data) ? data : (data?.events || data?.data || []);

    const events = raw
      .filter(e => {
        // Only include high-impact events from FXStreet to avoid noise
        const imp = mapImpact(e.volatility || e.impact || e.importance);
        const title = e.name || e.title || '';
        const lower = title.toLowerCase();
        const isRateDecision = lower.includes('rate decision') ||
                               lower.includes('monetary policy') ||
                               lower.includes('interest rate');
        return imp === 'High' || isRateDecision;
      })
      .map(e => {
        const title   = e.name || e.title || 'Unknown Event';
        const impact  = mapImpact(e.volatility || e.impact || e.importance);
        const rawCountry = (e.currencyCode || e.currency || e.country || 'USD').toUpperCase();
        const country = COUNTRY_MAP[rawCountry] || 'USD';
        const dateStr = e.dateUtc || e.date || e.time || '';
        const type    = classifyType(title);

        const slug    = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const dateKey = dateStr.slice(0, 10);

        return {
          id:       `fxs-${slug.slice(0, 40)}-${dateKey}`,
          title,
          date:     dateStr,
          type,
          impact,
          country,
          forecast: e.forecast  != null ? String(e.forecast)  : null,
          previous: e.previous  != null ? String(e.previous)  : null,
          actual:   e.actual    != null ? String(e.actual)    : null,
          source:   'FXStreet',
        };
      });

    await cache.set(CACHE_KEY, events, CACHE_TTL).catch(() => {});
    console.log(`[FXStreet] Fetched ${events.length} high-impact events (${fromStr} → ${toStr})`);
    return events;

  } catch (err) {
    const status = err.response?.status;
    if (status === 401) {
      console.warn('[FXStreet] API key invalid or expired (401). Skipping FXStreet events.');
    } else if (status === 403) {
      console.warn('[FXStreet] Access forbidden (403). Skipping FXStreet events.');
    } else if (status === 429) {
      console.warn('[FXStreet] Rate limited (429). Skipping FXStreet events.');
    } else {
      console.error('[FXStreet] Fetch failed:', err.message);
    }
    return [];
  }
}

module.exports = { getEvents };
