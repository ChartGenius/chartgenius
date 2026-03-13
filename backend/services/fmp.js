/**
 * FMP (Financial Modeling Prep) Market Service
 *
 * Provides:
 *   - getMarketStatus()     — current market session (open/pre-market/after-hours/closed/holiday)
 *   - getMarketHolidays()   — upcoming NYSE market holidays as calendar events
 *
 * Key behavior:
 *   - Market status is computed from ET time + holiday list (no API call needed)
 *   - Holidays: tries FMP API first (FMP_API_KEY env var), falls back to static list
 *   - Static list covers 2025–2026 NYSE holidays
 *   - Graceful fallback: always returns data, never throws to callers
 *
 * Cache TTLs:
 *   - Market status: 5 minutes
 *   - Holidays:      24 hours (they don't change)
 */

const axios = require('axios');
const cache = require('./cache');

// ─── Static NYSE Holiday List (2025–2026) ─────────────────────────────────────
// Used as fallback when FMP API key is not set or API is unavailable.

const NYSE_HOLIDAYS = [
  // 2025
  { date: '2025-01-01', name: "New Year's Day" },
  { date: '2025-01-09', name: 'National Day of Mourning (Jimmy Carter)' },
  { date: '2025-01-20', name: 'Martin Luther King Jr. Day' },
  { date: '2025-02-17', name: "Presidents' Day" },
  { date: '2025-04-18', name: 'Good Friday' },
  { date: '2025-05-26', name: 'Memorial Day' },
  { date: '2025-06-19', name: 'Juneteenth National Independence Day' },
  { date: '2025-07-04', name: 'Independence Day' },
  { date: '2025-09-01', name: 'Labor Day' },
  { date: '2025-11-27', name: 'Thanksgiving Day' },
  { date: '2025-12-25', name: 'Christmas Day' },
  // 2026
  { date: '2026-01-01', name: "New Year's Day" },
  { date: '2026-01-19', name: 'Martin Luther King Jr. Day' },
  { date: '2026-02-16', name: "Presidents' Day" },
  { date: '2026-04-03', name: 'Good Friday' },
  { date: '2026-05-25', name: 'Memorial Day' },
  { date: '2026-06-19', name: 'Juneteenth National Independence Day' },
  { date: '2026-07-03', name: 'Independence Day (observed)' }, // July 4 falls on Saturday
  { date: '2026-09-07', name: 'Labor Day' },
  { date: '2026-11-26', name: 'Thanksgiving Day' },
  { date: '2026-12-25', name: 'Christmas Day' },
];

// ─── ET Time Helpers ─────────────────────────────────────────────────────────

function getETTime() {
  const now    = new Date();
  const etStr  = now.toLocaleString('en-US', { timeZone: 'America/New_York' });
  const etDate = new Date(etStr);
  return {
    day:          etDate.getDay(), // 0=Sun, 6=Sat
    hours:        etDate.getHours(),
    minutes:      etDate.getMinutes(),
    totalMinutes: etDate.getHours() * 60 + etDate.getMinutes(),
    dateStr:      now.toLocaleDateString('en-CA', { timeZone: 'America/New_York' }), // YYYY-MM-DD
    etDate,
  };
}

function isNYSEHoliday(dateStr) {
  return NYSE_HOLIDAYS.some(h => h.date === dateStr);
}

function getNYSEHolidayName(dateStr) {
  const h = NYSE_HOLIDAYS.find(h => h.date === dateStr);
  return h ? h.name : null;
}

/** Walk forward to next weekday that is not a holiday */
function getNextBusinessDay(fromDateStr) {
  const d = new Date(fromDateStr + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + 1);
  for (let i = 0; i < 14; i++) {
    const dayOfWeek = d.getUTCDay();
    const str       = d.toISOString().slice(0, 10);
    if (dayOfWeek >= 1 && dayOfWeek <= 5 && !isNYSEHoliday(str)) return str;
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return 'TBD';
}

// ─── Market Status ────────────────────────────────────────────────────────────

/**
 * Compute current market session status from ET time + holiday calendar.
 * Pure computation — no API call needed.
 *
 * @returns {{ isOpen: boolean, session: string, nextOpen: string|null, nextClose: string|null, holidayName?: string }}
 */
function computeMarketStatus() {
  const { day, totalMinutes, dateStr } = getETTime();
  const isWeekday = day >= 1 && day <= 5;

  const PRE_MARKET_START = 4 * 60;       // 4:00 AM ET
  const REGULAR_OPEN     = 9 * 60 + 30;  // 9:30 AM ET
  const REGULAR_CLOSE    = 16 * 60;      // 4:00 PM ET
  const AFTER_HOURS_END  = 20 * 60;      // 8:00 PM ET

  const holiday     = isNYSEHoliday(dateStr);
  const holidayName = holiday ? getNYSEHolidayName(dateStr) : undefined;

  // Weekend or holiday
  if (!isWeekday || holiday) {
    const nextDay = getNextBusinessDay(dateStr);
    return {
      isOpen:      false,
      session:     holiday ? 'Holiday' : 'Closed',
      holidayName,
      nextOpen:    `Opens ${nextDay} 9:30 AM ET`,
      nextClose:   null,
    };
  }

  // Regular market hours (most common case)
  if (totalMinutes >= REGULAR_OPEN && totalMinutes < REGULAR_CLOSE) {
    const minsLeft = REGULAR_CLOSE - totalMinutes;
    const h = Math.floor(minsLeft / 60);
    const m = minsLeft % 60;
    return {
      isOpen:    true,
      session:   'Regular',
      nextOpen:  null,
      nextClose: h > 0 ? `Closes in ${h}h ${m}m (4:00 PM ET)` : `Closes in ${m}m (4:00 PM ET)`,
    };
  }

  // Pre-market
  if (totalMinutes >= PRE_MARKET_START && totalMinutes < REGULAR_OPEN) {
    const minsLeft = REGULAR_OPEN - totalMinutes;
    const h = Math.floor(minsLeft / 60);
    const m = minsLeft % 60;
    return {
      isOpen:    false,
      session:   'Pre-Market',
      nextOpen:  h > 0 ? `Regular opens in ${h}h ${m}m (9:30 AM ET)` : `Regular opens in ${m}m (9:30 AM ET)`,
      nextClose: null,
    };
  }

  // After-hours
  if (totalMinutes >= REGULAR_CLOSE && totalMinutes < AFTER_HOURS_END) {
    const minsLeft = AFTER_HOURS_END - totalMinutes;
    const h = Math.floor(minsLeft / 60);
    const m = minsLeft % 60;
    return {
      isOpen:    false,
      session:   'After-Hours',
      nextOpen:  null,
      nextClose: h > 0 ? `After-hours closes in ${h}h ${m}m (8:00 PM ET)` : `After-hours closes in ${m}m (8:00 PM ET)`,
    };
  }

  // Late night (before pre-market next day)
  const nextDay = getNextBusinessDay(dateStr);
  const isTomorrow = new Date(nextDay) - new Date(dateStr) <= 24 * 3600 * 1000;
  return {
    isOpen:    false,
    session:   'Closed',
    nextOpen:  isTomorrow ? 'Tomorrow 9:30 AM ET' : `Opens ${nextDay} 9:30 AM ET`,
    nextClose: null,
  };
}

/**
 * Get current market status.
 * Cached for 5 minutes.
 *
 * @returns {Promise<{ isOpen: boolean, session: string, nextOpen: string|null, nextClose: string|null, holidayName?: string }>}
 */
async function getMarketStatus() {
  const CACHE_KEY = 'fmp:market-status';
  const cached = await cache.get(CACHE_KEY).catch(() => null);
  if (cached) return cached;

  const status = computeMarketStatus();
  await cache.set(CACHE_KEY, status, 300).catch(() => {}); // 5 min TTL
  return status;
}

// ─── Market Holidays as Calendar Events ──────────────────────────────────────

/**
 * Convert a holiday entry to a standard calendar event.
 */
function makeHolidayEvent(dateStr, name) {
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return {
    id:       `fmp-holiday-${slug}-${dateStr}`,
    title:    `\uD83C\uDFDB\uFE0F Market Closed \u2014 ${name}`, // 🏛️ Market Closed — Name
    date:     `${dateStr}T00:00:00-05:00`, // NYSE market day start in ET
    type:     'holiday',
    impact:   'Holiday',
    country:  'USD',
    forecast: null,
    previous: null,
    actual:   null,
    source:   'FMP',
  };
}

/**
 * Try to fetch holidays from FMP API.
 * FMP v3 endpoint: GET /market_hours?exchange=NYSE&apikey=...
 */
async function fetchFMPHolidaysFromAPI(apiKey, fromStr, toStr) {
  // Try the market_hours endpoint which includes holiday schedule for US markets
  const url = `https://financialmodelingprep.com/api/v3/market_hours?exchange=NYSE&apikey=${apiKey}`;
  const { data } = await axios.get(url, { timeout: 10000 });

  // FMP returns { stockExchangeName, openingHour, closingHour, holidays: [{year, nameOfHoliday, date}] }
  const holidayList = Array.isArray(data)
    ? data.flatMap(ex => ex.holidays || [])
    : (data?.holidays || []);

  if (!holidayList.length) return null;

  return holidayList
    .filter(h => {
      const d = (h.date || '').slice(0, 10);
      return d && (!fromStr || d >= fromStr) && (!toStr || d <= toStr);
    })
    .map(h => {
      const d    = (h.date || '').slice(0, 10);
      const name = h.nameOfHoliday || h.name || h.holiday || 'Market Holiday';
      return makeHolidayEvent(d, name);
    });
}

/**
 * Get upcoming NYSE market holidays as calendar events.
 * Tries FMP API first (FMP_API_KEY env var), falls back to static list.
 * Cached for 24 hours.
 *
 * @param {Object} opts
 * @param {string} opts.from - YYYY-MM-DD (optional)
 * @param {string} opts.to   - YYYY-MM-DD (optional)
 * @returns {Promise<Array>} Holiday calendar events
 */
async function getMarketHolidays({ from, to } = {}) {
  const now     = new Date();
  const fromStr = from || now.toISOString().slice(0, 10);
  const toStr   = to   || new Date(now.getTime() + 365 * 24 * 3600 * 1000).toISOString().slice(0, 10);

  const CACHE_KEY = `fmp:holidays:${fromStr}:${toStr}`;
  const cached = await cache.get(CACHE_KEY).catch(() => null);
  if (cached) return cached;

  // Try FMP API if key is configured (read lazily)
  const apiKey = process.env.FMP_API_KEY;
  if (apiKey) {
    try {
      const events = await fetchFMPHolidaysFromAPI(apiKey, fromStr, toStr);
      if (events && events.length > 0) {
        await cache.set(CACHE_KEY, events, 86400).catch(() => {});
        console.log(`[FMP] Fetched ${events.length} market holidays from API`);
        return events;
      }
    } catch (err) {
      const status = err.response?.status;
      if (status === 401 || status === 403) {
        console.warn(`[FMP] API key rejected (${status}). Falling back to static holiday list.`);
      } else {
        console.warn('[FMP] Holiday fetch failed, falling back to static list:', err.message);
      }
    }
  }

  // Fallback: static NYSE holiday list
  const staticEvents = NYSE_HOLIDAYS
    .filter(h => h.date >= fromStr && h.date <= toStr)
    .map(h => makeHolidayEvent(h.date, h.name));

  await cache.set(CACHE_KEY, staticEvents, 86400).catch(() => {});
  if (staticEvents.length > 0) {
    console.log(`[FMP] Using static holiday list: ${staticEvents.length} holidays (${fromStr} → ${toStr})`);
  }
  return staticEvents;
}

module.exports = {
  getMarketStatus,
  getMarketHolidays,
  computeMarketStatus,
  NYSE_HOLIDAYS,
};
