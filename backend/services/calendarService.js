/**
 * Comprehensive Calendar Service
 *
 * Aggregates events from:
 *  1. ForexFactory JSON API — this week  (economic events + speakers)
 *  2. ForexFactory JSON API — next week
 *  3. Finnhub Earnings Calendar
 *  4. Finnhub Economic Calendar (speeches, rate decisions, etc.)
 *  5. Federal Reserve RSS feed (speeches, statements)
 *
 * Unified endpoint returns typed events:
 *   economic | earnings | speech | holiday
 */

const axios = require('axios');
const RSSParser = require('rss-parser');
const cache = require('./cache');
const fxstreet = require('./fxstreet');
const fmp = require('./fmp');

const rssParser = new RSSParser({
  timeout: 10000,
  headers: { 'User-Agent': 'TradVue/1.0 (tradvue.com; calendar-bot)' }
});

// ─── Circuit Breaker — ForexFactory ─────────────────────────────────────────
// Stop hammering FF when it's rate-limiting us. Opens on 429, auto-resets after 1h.

let ffCircuitOpen = false;
let ffCircuitOpenUntil = 0;

function isFFCircuitOpen() {
  if (!ffCircuitOpen) return false;
  if (Date.now() > ffCircuitOpenUntil) {
    ffCircuitOpen = false;
    console.log('[CalendarService] ForexFactory circuit breaker reset — retrying');
    return false;
  }
  return true;
}

function openFFCircuit(durationMs = 3600000) { // 1 hour default
  ffCircuitOpen = true;
  ffCircuitOpenUntil = Date.now() + durationMs;
  console.warn(`[CalendarService] ForexFactory circuit breaker OPEN — will retry in ${durationMs / 60000} min`);
}

// ─── Type Classification ────────────────────────────────────────────────────

const SPEECH_KEYWORDS = [
  'speaks', 'speech', 'testimony', 'chair', 'governor', 'president',
  'member', 'comments', 'statement', 'press conference', 'press briefing',
  'remarks', 'forum', 'panel', 'interview', 'hearing',
  'minutes', 'reserve bank', 'central bank',
  'fomc', 'mpc', 'ecb', 'boe', 'boc', 'rba', 'rbnz', 'boj',
  'lagarde', 'powell', 'bailey', 'waller', 'bowman', 'jefferson',
  'kashkari', 'bostic', 'logan', 'daly', 'kugler', 'cook', 'williams',
  'barkin', 'harker', 'mester', 'collins', 'schmid', 'goolsbee',
  'hammack', 'mueller', 'nagel', 'villeroy', 'lane', 'schnabel',
  'de guindos', 'elderson', 'panetta', 'cipollone'
];

const RATE_DECISION_KEYWORDS = [
  'interest rate', 'rate decision', 'monetary policy', 'rate statement',
  'fed decision', 'fomc decision', 'ecb decision', 'boe decision',
  'boc decision', 'rba decision', 'rbnz decision', 'boj decision',
  'cash rate', 'refinancing rate', 'bank rate'
];

function classifyEventType(title, source, impact) {
  const lower = title.toLowerCase();

  if (lower.includes('holiday') || lower.includes('daylight saving') || impact === 'Holiday') {
    return 'holiday';
  }
  if (source === 'Finnhub') return 'earnings';

  // Check rate decisions first (subset of speech but important to flag as speech)
  for (const kw of RATE_DECISION_KEYWORDS) {
    if (lower.includes(kw)) return 'speech';
  }

  for (const kw of SPEECH_KEYWORDS) {
    if (lower.includes(kw)) return 'speech';
  }

  return 'economic';
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Convert a Date to YYYY-MM-DD string in US Eastern Time (most financial events are ET).
 * This ensures "today" matches ForexFactory's ET-based dates.
 */
function toDateStr(date) {
  return date.toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); // en-CA gives YYYY-MM-DD
}

function parseDate(str) {
  try {
    const d = new Date(str);
    return isNaN(d.getTime()) ? new Date(0) : d;
  } catch {
    return new Date(0);
  }
}

/**
 * Get start/end of a date in ET for proper "today" filtering.
 * ForexFactory events use ET dates, so we must compare in ET.
 */
function getETDayBounds(date) {
  const etDateStr = date.toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
  // Create boundaries using ET midnight
  const start = new Date(`${etDateStr}T00:00:00-04:00`);
  const end = new Date(`${etDateStr}T23:59:59-04:00`);
  return { start, end, dateStr: etDateStr };
}

// ─── Request deduplication ───────────────────────────────────────────────────
// Prevents multiple simultaneous fetches to the same URL (startup stampede)
const inflight = new Map();

async function dedupedFetch(key, fn) {
  if (inflight.has(key)) return inflight.get(key);
  const promise = fn().finally(() => inflight.delete(key));
  inflight.set(key, promise);
  return promise;
}

/**
 * Normalize a ForexFactory date string to ISO 8601.
 * FF format: "03-11-2026T08:30:00-0500"  (MM-DD-YYYYTHH:MM:SS±HHMM)
 */
function normalizeFfDate(dateStr) {
  if (!dateStr) return dateStr;
  const ffMatch = dateStr.match(/^(\d{2})-(\d{2})-(\d{4})T(.+)$/);
  if (!ffMatch) return dateStr;
  let iso = `${ffMatch[3]}-${ffMatch[1]}-${ffMatch[2]}T${ffMatch[4]}`;
  // Normalize timezone offset: -0500 → -05:00
  iso = iso.replace(/([+-])(\d{2})(\d{2})$/, '$1$2:$3');
  return iso;
}

// ─── ForexFactory (JSON) ─────────────────────────────────────────────────────

async function fetchForexFactoryWeek(week = 'thisweek') {
  // Include today's ET date in cache key so cache auto-busts at midnight ET
  const todayET = toDateStr(new Date());
  const CACHE_KEY = `calendar:ff:${week}:${todayET}`;

  // Circuit breaker — if FF has been rate-limiting us, serve stale and bail early
  if (isFFCircuitOpen()) {
    const stale = await cache.get(CACHE_KEY + ':stale').catch(() => null);
    if (stale) return stale;
    return [];
  }

  const cached = await cache.get(CACHE_KEY).catch(() => null);
  if (cached) return cached;

  return dedupedFetch(`ff:${week}:${todayET}`, async () => {
    // Double-check cache after acquiring dedup lock
    const cachedAgain = await cache.get(CACHE_KEY).catch(() => null);
    if (cachedAgain) return cachedAgain;

  try {
    const url = `https://nfs.faireconomy.media/ff_calendar_${week}.json`;
    const { data } = await axios.get(url, {
      timeout: 15000,
      headers: { 'User-Agent': 'TradVue/1.0 (tradvue.com; calendar-bot)' }
    });

    const events = (Array.isArray(data) ? data : []).map(e => {
      const title = e.title || '';
      const impact = e.impact || 'Low';
      const type = classifyEventType(title, 'ForexFactory', impact);
      const isoDate = normalizeFfDate(e.date || '');

      const id = `ff-${title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${(e.date || '').slice(0, 10)}`;

      return {
        id,
        title,
        date: isoDate || e.date || '',
        type,
        impact,
        country: (e.country || 'USD').toUpperCase(),
        forecast: e.forecast || null,
        previous: e.previous || null,
        actual: e.actual || null,
        source: 'ForexFactory'
      };
    });

    // Cache aggressively — FF data rarely changes intraday
    const ttl = week === 'thisweek' ? 21600 : 43200; // 6h this week, 12h next week
    await cache.set(CACHE_KEY, events, ttl).catch(() => {});
    // Keep a long-lived stale copy for 429 fallback (24h)
    await cache.set(CACHE_KEY + ':stale', events, 86400).catch(() => {});
    return events;
  } catch (err) {
    const status = err.response?.status;
    if (status === 404) {
      // Next week not published yet — cache empty result briefly
      await cache.set(CACHE_KEY, [], 600).catch(() => {});
    } else if (status === 429) {
      console.warn(`[CalendarService] ForexFactory ${week} rate limited (429) — keeping stale cache`);
      openFFCircuit(3600000); // Stop trying for 1 hour
      // Don't overwrite cache with empty — return stale data if we had any
      const stale = await cache.get(CACHE_KEY + ':stale').catch(() => null);
      if (stale) return stale;
    } else {
      console.error(`[CalendarService] ForexFactory ${week} fetch failed:`, err.message);
    }
    return [];
  }
  }); // end dedupedFetch
}

async function fetchForexFactory() {
  // Fetch both this week and next week in parallel
  const [thisWeek, nextWeek] = await Promise.all([
    fetchForexFactoryWeek('thisweek'),
    fetchForexFactoryWeek('nextweek')
  ]);

  // Deduplicate by ID (in case of overlap at week boundary)
  const seen = new Set();
  const all = [];
  for (const e of [...thisWeek, ...nextWeek]) {
    if (!seen.has(e.id)) {
      seen.add(e.id);
      all.push(e);
    }
  }
  return all;
}

// ─── Finnhub Earnings ────────────────────────────────────────────────────────

async function fetchFinnhubEarnings(from, to) {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    console.warn('[CalendarService] FINNHUB_API_KEY not set, skipping earnings');
    return [];
  }

  const CACHE_KEY = `calendar:earnings:${from}:${to}`;
  const cached = await cache.get(CACHE_KEY).catch(() => null);
  if (cached) return cached;

  try {
    const url = `https://finnhub.io/api/v1/calendar/earnings?from=${from}&to=${to}&token=${apiKey}`;
    const { data } = await axios.get(url, { timeout: 15000 });

    const earningsList = data?.earningsCalendar || [];
    const events = earningsList.map(e => {
      const symbol = e.symbol || '';
      const dateStr = e.date || '';
      const hour = e.hour || '';
      let timeStr = dateStr;
      if (hour === 'bmo') timeStr = `${dateStr}T07:00:00-04:00`;       // Before market open (ET)
      else if (hour === 'amc') timeStr = `${dateStr}T16:30:00-04:00`; // After market close (ET)
      else timeStr = `${dateStr}T12:00:00-04:00`;                     // During market hours (ET)

      return {
        id: `fh-earn-${symbol.toLowerCase()}-${dateStr}`,
        title: `${symbol} Earnings`,
        date: timeStr,
        type: 'earnings',
        impact: 'High',
        country: 'USD',
        symbol,
        epsEstimate: e.epsEstimate ?? null,
        epsActual: e.epsActual ?? null,
        revenueEstimate: e.revenueEstimate ?? null,
        revenueActual: e.revenueActual ?? null,
        hour,
        forecast: e.epsEstimate != null ? `EPS: ${e.epsEstimate}` : null,
        previous: null,
        actual: e.epsActual != null ? `EPS: ${e.epsActual}` : null,
        source: 'Finnhub'
      };
    });

    await cache.set(CACHE_KEY, events, 43200).catch(() => {}); // 12h — earnings schedules don't change often
    return events;
  } catch (err) {
    console.error('[CalendarService] Finnhub earnings fetch failed:', err.message);
    return [];
  }
}

// ─── Finnhub Economic Calendar ───────────────────────────────────────────────

async function fetchFinnhubEconomic(from, to) {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) return [];

  const CACHE_KEY = `calendar:finnhub-econ:${from}:${to}`;
  const cached = await cache.get(CACHE_KEY).catch(() => null);
  if (cached) return cached;

  try {
    const url = `https://finnhub.io/api/v1/calendar/economic?from=${from}&to=${to}&token=${apiKey}`;
    const { data } = await axios.get(url, { timeout: 15000 });

    const econList = data?.economicCalendar || [];
    const events = econList.map(e => {
      const title = e.event || '';
      const country = (e.country || 'USD').toUpperCase();

      // Map Finnhub impact (number) to string
      let impact = 'Low';
      if (e.impact != null) {
        if (e.impact >= 3) impact = 'High';
        else if (e.impact >= 2) impact = 'Medium';
        else impact = 'Low';
      }

      const type = classifyEventType(title, 'FinnhubEcon', impact);
      const dateStr = e.time || e.date || '';

      return {
        id: `fh-econ-${title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${dateStr.slice(0, 10)}`,
        title,
        date: dateStr,
        type,
        impact,
        country,
        forecast: e.estimate != null ? String(e.estimate) : null,
        previous: e.prev != null ? String(e.prev) : null,
        actual: e.actual != null ? String(e.actual) : null,
        unit: e.unit || null,
        source: 'Finnhub'
      };
    });

    await cache.set(CACHE_KEY, events, 3600).catch(() => {});
    return events;
  } catch (err) {
    const status = err.response?.status;
    if (status === 403) {
      console.warn('[CalendarService] Finnhub economic calendar returned 403 — API limit or endpoint blocked. Skipping gracefully.');
      // Cache empty result briefly to avoid hammering blocked endpoint
      await cache.set(CACHE_KEY, [], 600).catch(() => {});
    } else {
      console.error('[CalendarService] Finnhub economic calendar fetch failed:', err.message);
    }
    return [];
  }
}

// ─── Federal Reserve RSS ─────────────────────────────────────────────────────

async function fetchFedRSS() {
  const CACHE_KEY = 'calendar:fed:rss';
  const cached = await cache.get(CACHE_KEY).catch(() => null);
  if (cached) return cached;

  try {
    const url = 'https://www.federalreserve.gov/feeds/press_all.xml';
    const feed = await rssParser.parseURL(url);

    const cutoffBack = new Date(Date.now() - 7 * 24 * 3600 * 1000);
    const cutoffFwd = new Date(Date.now() + 30 * 24 * 3600 * 1000);

    const events = (feed.items || [])
      .filter(item => {
        const d = new Date(item.pubDate || item.isoDate);
        return d >= cutoffBack && d <= cutoffFwd;
      })
      .map(item => {
        const title = item.title || '';
        // Parse pubDate through Date to normalize malformed strings like "Tue, 10 Ma"
        const rawDate = item.pubDate || item.isoDate || '';
        const parsedDate = rawDate ? new Date(rawDate) : new Date();
        const date = !isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : new Date().toISOString();
        const lower = title.toLowerCase();

        let impact = 'Medium';
        if (lower.includes('chair') || lower.includes('fomc') || lower.includes('minutes') ||
            lower.includes('rate decision') || lower.includes('monetary policy')) impact = 'High';
        else if (lower.includes('speech') || lower.includes('remarks') || lower.includes('governor') ||
                 lower.includes('president') || lower.includes('member')) impact = 'Medium';
        else impact = 'Low';

        const type = classifyEventType(title, 'FederalReserve', impact);

        return {
          id: `fed-${title.slice(0, 40).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${new Date(date).toISOString().slice(0, 10)}`,
          title,
          date,
          type,
          impact,
          country: 'USD',
          forecast: null,
          previous: null,
          actual: null,
          url: item.link || null,
          source: 'FederalReserve'
        };
      });

    await cache.set(CACHE_KEY, events, 1800).catch(() => {});
    return events;
  } catch (err) {
    console.error('[CalendarService] Fed RSS fetch failed:', err.message);
    return [];
  }
}

// ─── Smart Cross-Source Deduplication ────────────────────────────────────────
//
// Events from different sources (FF + Finnhub) can describe the same real-world
// event with different IDs (e.g. "ADBE Earnings" from both FF and Finnhub).
// We deduplicate by a normalized content key, keeping the richer record.

/**
 * Build a stable content key for deduplication across sources.
 *   earnings  → "earnings-{symbol}-{YYYY-MM-DD}"
 *   others    → "{type}-{title-slug(40)}-{YYYY-MM-DD}"
 */
function normalizeEventKey(e) {
  let dateStr;
  try {
    dateStr = toDateStr(parseDate(e.date));
  } catch {
    dateStr = (e.date || '').slice(0, 10);
  }

  if (e.type === 'earnings' && e.symbol) {
    return `earnings-${e.symbol.toLowerCase()}-${dateStr}`;
  }

  const slug = (e.title || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return `${e.type || 'event'}-${slug}-${dateStr}`;
}

/**
 * Score how many meaningful data fields are populated.
 * Higher = richer record; prefer this one when deduplicating.
 */
function eventDataScore(e) {
  return [
    e.forecast, e.previous, e.actual,
    e.symbol, e.url,
    e.epsEstimate, e.epsActual,
    e.revenueEstimate, e.revenueActual
  ].filter(v => v != null && v !== '').length;
}

/**
 * Deduplicate events across sources.
 * - Primary key: normalizeEventKey (content-based, cross-source)
 * - Tiebreak:    keep the record with more data fields populated
 */
function smartDeduplicate(events) {
  // Map: normalKey → best event so far
  const best = new Map();

  for (const e of events) {
    const key = normalizeEventKey(e);
    if (!best.has(key)) {
      best.set(key, e);
    } else if (eventDataScore(e) > eventDataScore(best.get(key))) {
      best.set(key, e); // richer record wins
    }
  }

  return Array.from(best.values());
}

// ─── Static Recurring US Economic Events ─────────────────────────────────────
//
// Fallback when ForexFactory is rate-limited (429). Generates approximate dates
// for well-known recurring US economic events based on typical BLS/Census/Fed
// schedules. These ONLY fill gaps — they never override real data from primary
// sources. Events carry source='TradVue' and id='static-*' so they're easy to
// identify.

/** FOMC meeting decision dates (2nd day of each meeting = decision day) */
const FOMC_DECISION_DATES = new Set([
  // 2025
  '2025-01-29', '2025-03-19', '2025-05-07', '2025-06-18',
  '2025-07-30', '2025-09-17', '2025-10-29', '2025-12-10',
  // 2026
  '2026-01-29', '2026-03-19', '2026-05-07', '2026-06-18',
  '2026-07-30', '2026-09-17', '2026-11-05', '2026-12-17',
  // 2027 (approximate, update when Fed publishes official schedule)
  '2027-02-03', '2027-03-17', '2027-05-05', '2027-06-16',
  '2027-07-28', '2027-09-15', '2027-11-03', '2027-12-15',
]);

/**
 * Determine whether US DST is active for a given calendar date.
 * DST starts 2nd Sunday in March, ends 1st Sunday in November.
 * @returns {string} '-04:00' (EDT) or '-05:00' (EST)
 */
function getETOffset(year, month, day) {
  // 2nd Sunday in March
  const marchFirst = new Date(year, 2, 1);
  const marchFirstDow = marchFirst.getDay(); // 0=Sun
  const dstStart = new Date(year, 2, marchFirstDow === 0 ? 8 : 8 + (7 - marchFirstDow));
  // 1st Sunday in November
  const novFirst = new Date(year, 10, 1);
  const novFirstDow = novFirst.getDay();
  const dstEnd = new Date(year, 10, novFirstDow === 0 ? 1 : 1 + (7 - novFirstDow));

  const check = new Date(year, month - 1, day);
  return (check >= dstStart && check < dstEnd) ? '-04:00' : '-05:00';
}

/**
 * Return the date of the first Friday in a given month.
 */
function getFirstFridayOfMonth(year, month) {
  const first = new Date(year, month - 1, 1);
  const dow = first.getDay(); // 0=Sun … 5=Fri
  return 1 + ((5 - dow + 7) % 7); // day-of-month (1–7)
}

/**
 * Fuzzy title match — returns true when titles share ≥70% significant words.
 * Used to avoid adding static duplicates of real events with slightly different
 * phrasing (e.g. "CPI m/m" vs "Consumer Price Index MoM").
 */
function fuzzyTitleMatch(a, b) {
  const tokenize = s => s.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2);
  const wordsA = new Set(tokenize(a));
  const wordsB = new Set(tokenize(b));
  if (wordsA.size === 0 || wordsB.size === 0) {
    return a.toLowerCase().trim() === b.toLowerCase().trim();
  }
  let overlap = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) overlap++;
  }
  return (overlap / Math.max(wordsA.size, wordsB.size)) >= 0.7;
}

/**
 * Generate static recurring US economic events for a date range.
 *
 * @param {string} fromStr - YYYY-MM-DD
 * @param {string} toStr   - YYYY-MM-DD
 * @returns {Array} Calendar events with source='TradVue'
 */
function getStaticRecurringEvents(fromStr, toStr) {
  const fromDate = new Date(fromStr + 'T00:00:00');
  const toDate   = new Date(toStr   + 'T23:59:59');
  const events = [];

  /** Build an ISO date-time string in ET for the given components. */
  function makeISODate(year, month, day, hhmm) {
    const offset = getETOffset(year, month, day);
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${hhmm}:00${offset}`;
  }

  function makeId(title, dateStr) {
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return `static-${slug}-${dateStr}`;
  }

  /**
   * Conditionally add one event — skips if outside range or falls on a weekend
   * (economic releases are never on Sat/Sun; we skip rather than roll-forward to
   * keep the data honest — approximate but not misleading).
   */
  function addEvent(title, year, month, day, hhmm, impact, eventType = 'economic') {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const d = new Date(dateStr + 'T12:00:00'); // noon local to avoid TZ edge cases
    if (d < fromDate || d > toDate) return;
    const dow = d.getDay();
    if (dow === 0 || dow === 6) return; // skip weekends

    events.push({
      id:       makeId(title, dateStr),
      title,
      date:     makeISODate(year, month, day, hhmm),
      type:     eventType,
      impact,
      country:  'USD',
      forecast: null,
      previous: null,
      actual:   null,
      source:   'TradVue',
    });
  }

  // ── Monthly events ──────────────────────────────────────────────────────────
  // Walk month-by-month across the requested range
  let cur = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1);
  const lastMonth = new Date(toDate.getFullYear(), toDate.getMonth(), 1);

  while (cur <= lastMonth) {
    const year  = cur.getFullYear();
    const month = cur.getMonth() + 1; // 1-indexed

    // 1st Friday — Non-Farm Payrolls + Unemployment Rate
    const nfpDay = getFirstFridayOfMonth(year, month);
    addEvent('Non-Farm Payrolls',   year, month, nfpDay, '08:30', 'High');
    addEvent('Unemployment Rate',   year, month, nfpDay, '08:30', 'High');

    // ~10th — CPI
    addEvent('CPI m/m',             year, month, 10, '08:30', 'High');
    addEvent('Core CPI m/m',        year, month, 10, '08:30', 'High');

    // ~13th — PPI
    addEvent('PPI m/m',             year, month, 13, '08:30', 'Medium');

    // ~15th — Retail Sales
    addEvent('Retail Sales m/m',    year, month, 15, '08:30', 'High');
    addEvent('Core Retail Sales m/m', year, month, 15, '08:30', 'High');

    // ~16th — Industrial Production
    addEvent('Industrial Production m/m', year, month, 16, '09:15', 'Medium');

    // ~20th — Housing
    addEvent('Housing Starts',      year, month, 20, '08:30', 'Medium');
    addEvent('Building Permits',    year, month, 20, '08:30', 'Medium');

    // ~25th — Durable Goods
    addEvent('Durable Goods Orders m/m', year, month, 25, '08:30', 'Medium');

    // ~28th — GDP + Consumer Confidence
    addEvent('GDP q/q',             year, month, 28, '08:30', 'High');
    addEvent('Consumer Confidence', year, month, 28, '10:00', 'High');

    cur = new Date(year, month, 1); // advance to next month
  }

  // ── Weekly: Initial Jobless Claims (every Thursday) ─────────────────────────
  {
    const d = new Date(fromDate);
    // Advance to the first Thursday in range
    while (d.getDay() !== 4) d.setDate(d.getDate() + 1);
    while (d <= toDate) {
      addEvent('Initial Jobless Claims', d.getFullYear(), d.getMonth() + 1, d.getDate(), '08:30', 'High');
      d.setDate(d.getDate() + 7);
    }
  }

  // ── FOMC decision days (hardcoded dates, 8× per year) ───────────────────────
  for (const fomcDateStr of FOMC_DECISION_DATES) {
    const d = new Date(fomcDateStr + 'T12:00:00');
    if (d < fromDate || d > toDate) continue;
    const year  = d.getFullYear();
    const month = d.getMonth() + 1;
    const day   = d.getDate();
    addEvent('FOMC Statement & Rate Decision', year, month, day, '14:00', 'High', 'speech');
    addEvent('FOMC Press Conference',          year, month, day, '14:30', 'High', 'speech');
  }

  return events;
}

// ─── Unified getEvents ───────────────────────────────────────────────────────

/**
 * Get all calendar events within a date range.
 *
 * @param {Object} opts
 * @param {string} opts.from - YYYY-MM-DD
 * @param {string} opts.to   - YYYY-MM-DD
 * @param {string} opts.type - 'all' | 'economic' | 'earnings' | 'speech' | 'holiday'
 * @returns {Promise<Array>}
 */
async function getEvents({ from, to, type = 'all' } = {}) {
  const now = new Date();

  // If `from`/`to` are already YYYY-MM-DD strings, use them directly to avoid
  // UTC→ET timezone drift (new Date("2026-03-13") = midnight UTC = 8pm ET Mar 12).
  const fromStr = (typeof from === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(from))
    ? from
    : toDateStr(from ? new Date(from) : now);
  const toStr = (typeof to === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(to))
    ? to
    : toDateStr(to ? new Date(to) : new Date(now.getTime() + 30 * 24 * 3600 * 1000));

  // Fetch all sources in parallel
  const [ffEvents, finnhubEarnings, finnhubEcon, fedEvents, fxsEvents, fmpHolidays] = await Promise.all([
    fetchForexFactory(),
    fetchFinnhubEarnings(fromStr, toStr),
    fetchFinnhubEconomic(fromStr, toStr),
    fetchFedRSS(),
    fxstreet.getEvents({ from: fromStr, to: toStr }).catch(err => {
      console.error('[CalendarService] FXStreet fetch failed:', err.message);
      return [];
    }),
    fmp.getMarketHolidays({ from: fromStr, to: toStr }).catch(err => {
      console.error('[CalendarService] FMP holidays fetch failed:', err.message);
      return [];
    }),
  ]);

  // Merge + filter by date range (compare date strings in ET to avoid timezone drift)
  const all = [...ffEvents, ...finnhubEarnings, ...finnhubEcon, ...fedEvents, ...fxsEvents, ...fmpHolidays].filter(e => {
    try {
      const d = parseDate(e.date);
      if (isNaN(d.getTime())) return false;
      // Compare using ET date strings (YYYY-MM-DD) to match ForexFactory's ET-based dates
      const eventDateStr = toDateStr(d);
      return eventDateStr >= fromStr && eventDateStr <= toStr;
    } catch {
      return false;
    }
  });

  // Smart cross-source deduplication:
  //   earnings  → keyed by symbol + date (FF and Finnhub both report "ADBE Earnings")
  //   economic  → keyed by title-slug + date (same release from multiple feeds)
  // When duplicates exist, the record with more populated data fields wins.
  const deduped = smartDeduplicate(all);

  // ── Static recurring events — gap fill only ──────────────────────────────
  // Generate TradVue-sourced static events for the range, then add only those
  // that don't already exist in the real data (exact or fuzzy title + same date).
  // This ensures economic events always appear even when ForexFactory is down.
  const staticEvents = getStaticRecurringEvents(fromStr, toStr);
  if (staticEvents.length > 0) {
    // Build date→titles lookup from real events for O(1) per-day lookups
    const realTitlesByDate = new Map();
    for (const e of deduped) {
      let ds;
      try { ds = toDateStr(parseDate(e.date)); } catch { ds = (e.date || '').slice(0, 10); }
      if (!realTitlesByDate.has(ds)) realTitlesByDate.set(ds, []);
      realTitlesByDate.get(ds).push(e.title || '');
    }

    for (const se of staticEvents) {
      let ds;
      try { ds = toDateStr(parseDate(se.date)); } catch { ds = (se.date || '').slice(0, 10); }
      const titlesOnDay = realTitlesByDate.get(ds) || [];
      const isDuplicate = titlesOnDay.some(t =>
        t.toLowerCase() === se.title.toLowerCase() || fuzzyTitleMatch(t, se.title)
      );
      if (!isDuplicate) {
        deduped.push(se);
        // Update lookup so later static events also dedup against newly added ones
        if (!realTitlesByDate.has(ds)) realTitlesByDate.set(ds, []);
        realTitlesByDate.get(ds).push(se.title);
      }
    }
  }

  // Filter by type
  const filtered = type === 'all'
    ? deduped
    : deduped.filter(e => e.type === type);

  // Sort chronologically
  return filtered.sort((a, b) => parseDate(a.date) - parseDate(b.date));
}

/**
 * Get earnings only
 */
async function getEarnings({ from, to } = {}) {
  return getEvents({ from, to, type: 'earnings' });
}

/**
 * Get today's events
 */
async function getTodaysEvents({ currencies = null } = {}) {
  const { start, end, dateStr } = getETDayBounds(new Date());

  let events = await getEvents({
    from: dateStr,
    to: dateStr
  });

  if (currencies && currencies.length > 0) {
    const upper = currencies.map(c => c.toUpperCase());
    events = events.filter(e => upper.includes((e.country || '').toUpperCase()));
  }

  return events;
}

/**
 * Get upcoming events for next N days
 */
async function getUpcomingEvents({ days = 7, currencies = null, minImpact = 1 } = {}) {
  const now = new Date();
  const to = new Date(now.getTime() + days * 24 * 3600 * 1000);

  const IMPACT_RANK = { Low: 1, Medium: 2, High: 3, Holiday: 0 };
  const minRank = minImpact;

  let events = await getEvents({
    from: toDateStr(now),
    to: toDateStr(to)
  });

  // Apply impact filter — always include holidays regardless of minImpact
  events = events.filter(e => {
    if (e.type === 'holiday') return true; // Market holidays always included
    const rank = IMPACT_RANK[e.impact] ?? 1;
    return rank >= minRank;
  });

  if (currencies && currencies.length > 0) {
    const upper = currencies.map(c => c.toUpperCase());
    events = events.filter(e => upper.includes((e.country || '').toUpperCase()));
  }

  return events;
}

/**
 * Get high-impact events only
 */
async function getHighImpactEvents({ days = 7 } = {}) {
  return getUpcomingEvents({ days, minImpact: 3 });
}

module.exports = {
  getEvents,
  getEarnings,
  getTodaysEvents,
  getUpcomingEvents,
  getHighImpactEvents,
  fetchForexFactory,
  fetchFinnhubEarnings,
  fetchFinnhubEconomic,
  fetchFedRSS
};
