/**
 * Economic Calendar Service — Legacy adapter
 *
 * This service now delegates all data fetching to calendarService.js
 * which uses the ForexFactory JSON API (not the broken XML feed).
 *
 * Previously used ForexFactory XML RSS which returned empty/broken data
 * and fell back to mock events. That mock fallback has been removed.
 *
 * Endpoints that use this service:
 *   GET /api/calendar/today
 *   GET /api/calendar/upcoming
 *   GET /api/calendar/high-impact
 *   GET /api/calendar/macro
 */

const axios = require('axios');
const cache = require('./cache');
const calendarService = require('./calendarService');

// ─── FRED helpers (still used for getMacroSnapshot) ──────────────────────────

const FRED_API_KEY = process.env.FRED_API_KEY;

async function getFREDIndicator(seriesId, { limit = 10 } = {}) {
  if (!FRED_API_KEY) return null;

  const cacheKey = `fred:${seriesId}:${limit}`;
  const cached = await cache.get(cacheKey).catch(() => null);
  if (cached) return cached;

  try {
    const response = await axios.get('https://api.stlouisfed.org/fred/series/observations', {
      params: {
        series_id: seriesId,
        api_key: FRED_API_KEY,
        file_type: 'json',
        limit,
        sort_order: 'desc'
      },
      timeout: 10000
    });

    const result = response.data.observations?.map(obs => ({
      date: obs.date,
      value: obs.value === '.' ? null : parseFloat(obs.value),
      series: seriesId
    })) || [];

    await cache.set(cacheKey, result, 3600).catch(() => {});
    return result;
  } catch (err) {
    console.warn(`[EconCal] FRED ${seriesId} fetch failed:`, err.message);
    return null;
  }
}

// ─── Public API — delegates to calendarService ───────────────────────────────

/**
 * Get upcoming economic events for the next N days.
 * Now uses calendarService (ForexFactory JSON + Finnhub) instead of XML RSS.
 */
async function getUpcomingEvents({ days = 7, currencies = null, minImpact = 1 } = {}) {
  return calendarService.getUpcomingEvents({ days, currencies, minImpact });
}

/**
 * Get high-impact events only (impact level 3 = High)
 */
async function getHighImpactEvents({ days = 7 } = {}) {
  return calendarService.getHighImpactEvents({ days });
}

/**
 * Get today's events — real data from ForexFactory JSON + Finnhub.
 * No mock fallback.
 */
async function getTodaysEvents({ currencies = null } = {}) {
  return calendarService.getTodaysEvents({ currencies });
}

/**
 * Macro snapshot: FRED indicators + upcoming high-impact events
 */
async function getMacroSnapshot() {
  const cacheKey = 'calendar:macro_snapshot';
  const cached = await cache.get(cacheKey).catch(() => null);
  if (cached) return cached;

  const indicators = {};

  if (FRED_API_KEY) {
    const [cpi, unemployment, fedFunds] = await Promise.allSettled([
      getFREDIndicator('CPIAUCSL', { limit: 3 }),
      getFREDIndicator('UNRATE', { limit: 3 }),
      getFREDIndicator('FEDFUNDS', { limit: 3 })
    ]);
    indicators.cpi = cpi.status === 'fulfilled' ? cpi.value : null;
    indicators.unemployment = unemployment.status === 'fulfilled' ? unemployment.value : null;
    indicators.fedFunds = fedFunds.status === 'fulfilled' ? fedFunds.value : null;
  }

  indicators.upcomingHighImpact = await getHighImpactEvents({ days: 3 });

  const result = { indicators, lastUpdated: new Date().toISOString() };
  await cache.set(cacheKey, result, 3600).catch(() => {});
  return result;
}

module.exports = {
  getUpcomingEvents,
  getHighImpactEvents,
  getTodaysEvents,
  getMacroSnapshot,
  getFREDIndicator
};
