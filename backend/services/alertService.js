/**
 * Alert Service — Migrated to Supabase REST (IPv4/HTTPS)
 * 
 * NOTE: Migrated from db.query (direct Postgres/IPv6) to Supabase REST
 * to fix intermittent 500 errors on Render caused by IPv6 connectivity issues.
 */

const { createClient } = require('@supabase/supabase-js');
const rss = require('./rssFeedAggregator');

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL and a Supabase key are required');
  }
  return createClient(url, key);
}

// ─────────────────────────────────────────────────────────────────────────────
// Keyword taxonomy
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORY_KEYWORDS = {
  POLITICAL: [
    'trump', 'biden', 'congress', 'senate', 'house representatives',
    'white house', 'executive order', 'sanctions', 'geopolitical',
    'tariff', 'trade war', 'trade deal', 'import tax', 'export ban',
    'election', 'president', 'administration', 'regulatory', 'antitrust',
  ],
  FED: [
    'federal reserve', 'fed rate', 'fomc', 'powell', 'interest rate',
    'rate hike', 'rate cut', 'rate hold', 'basis points', 'bps',
    'monetary policy', 'quantitative easing', 'qe', 'tapering',
    'central bank', 'treasury yield', 'yield curve', 'bond market',
    'fed minutes', 'fed meeting', 'dot plot',
  ],
  ECONOMIC: [
    'inflation', 'cpi', 'consumer price', 'pce', 'deflation',
    'jobs report', 'nonfarm payroll', 'unemployment', 'jobless claims',
    'gdp', 'gross domestic product', 'recession', 'economic growth',
    'retail sales', 'housing starts', 'pmi', 'ism manufacturing',
    'consumer confidence', 'trade deficit', 'current account',
    'wage growth', 'labor market', 'supply chain',
  ],
  EARNINGS: [
    'earnings', 'quarterly results', 'q1 results', 'q2 results',
    'q3 results', 'q4 results', 'eps', 'revenue beat', 'revenue miss',
    'guidance', 'raised guidance', 'lowered guidance', 'outlook',
    'profit', 'loss', 'ipo', 'initial public offering', 'merger',
    'acquisition', 'buyout', 'dividend', 'stock split', 'buyback',
  ],
  BREAKING: [
    'breaking', 'urgent', 'flash crash', 'circuit breaker',
    'market halt', 'trading halt', 'black swan', 'systemic risk',
    'bank run', 'contagion', 'liquidity crisis', 'credit crisis',
    'default', 'bankruptcy', 'chapter 11', 'bailout', 'intervention',
    'war', 'conflict', 'attack', 'earthquake', 'pandemic', 'outbreak',
  ],
};

const HIGH_URGENCY_KEYWORDS = new Set([
  'fomc', 'rate hike', 'rate cut', 'emergency meeting', 'fed rate',
  'tariff', 'sanctions', 'executive order', 'trade war',
  'nonfarm payroll', 'jobs report', 'cpi', 'inflation', 'recession', 'gdp',
  'breaking', 'urgent', 'flash crash', 'circuit breaker', 'market halt',
  'default', 'bankruptcy', 'bailout', 'war', 'pandemic',
  'earnings', 'revenue beat', 'revenue miss',
]);

// ─────────────────────────────────────────────────────────────────────────────
// SSE Client Registry
// ─────────────────────────────────────────────────────────────────────────────

const sseClients = new Map();
let clientIdCounter = 0;

function registerSSEClient(res) {
  const id = `sse-${++clientIdCounter}-${Date.now()}`;
  sseClients.set(id, res);
  res.on('close', () => {
    sseClients.delete(id);
    console.info(`[Alerts] SSE client disconnected: ${id} (${sseClients.size} remaining)`);
  });
  console.info(`[Alerts] SSE client connected: ${id} (${sseClients.size} total)`);
  return id;
}

function broadcastAlert(alert) {
  const payload = `data: ${JSON.stringify(alert)}\n\n`;
  const dead = [];
  for (const [id, res] of sseClients) {
    try {
      res.write(payload);
    } catch (err) {
      console.warn(`[Alerts] Failed to write to SSE client ${id}:`, err.message);
      dead.push(id);
    }
  }
  dead.forEach(id => sseClients.delete(id));
  if (sseClients.size > 0) {
    console.info(`[Alerts] Broadcast to ${sseClients.size} SSE clients: [${alert.urgency}] ${alert.title?.slice(0, 60)}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Classification & Scoring
// ─────────────────────────────────────────────────────────────────────────────

function classifyCategory(text) {
  const scores = {};
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const hits = keywords.filter(kw => text.includes(kw));
    if (hits.length > 0) scores[cat] = { count: hits.length, hits };
  }
  if (Object.keys(scores).length === 0) return { category: 'BREAKING', keywordsHit: [] };
  const priority = ['FED', 'ECONOMIC', 'POLITICAL', 'EARNINGS', 'BREAKING'];
  const sorted = Object.entries(scores).sort((a, b) => {
    if (b[1].count !== a[1].count) return b[1].count - a[1].count;
    return priority.indexOf(a[0]) - priority.indexOf(b[0]);
  });
  const [category, { hits }] = sorted[0];
  return { category, keywordsHit: hits };
}

function scoreUrgency(text, keywordsHit, rssImpactScore) {
  const highHits = keywordsHit.filter(kw => HIGH_URGENCY_KEYWORDS.has(kw)).length;
  const totalHits = keywordsHit.length;
  let score = (rssImpactScore / 10) * 50;
  score += highHits * 15;
  score += totalHits * 5;
  score = Math.min(score, 100);
  let urgency;
  if (score >= 60 || highHits >= 1) urgency = 'HIGH';
  else if (score >= 30 || totalHits >= 2) urgency = 'MEDIUM';
  else urgency = 'LOW';
  return { urgency, urgencyScore: parseFloat(score.toFixed(2)) };
}

function transformToAlert(article) {
  const text = `${article.title} ${article.summary || ''}`.toLowerCase();
  const { category, keywordsHit } = classifyCategory(text);
  if (keywordsHit.length === 0 && article.impactScore < 4) return null;
  const { urgency, urgencyScore } = scoreUrgency(text, keywordsHit, article.impactScore || 0);
  return {
    external_id: article.id || article.url,
    title: article.title,
    summary: article.summary || null,
    url: article.url || null,
    source: article.source,
    category,
    urgency,
    urgency_score: urgencyScore,
    keywords_hit: keywordsHit,
    symbols: article.symbols || [],
    tags: article.tags || [],
    sentiment: article.sentimentLabel || 'neutral',
    sentiment_score: article.sentimentScore || 0,
    published_at: article.publishedAt || new Date().toISOString(),
    fetched_at: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Database Operations (Supabase REST — IPv4/HTTPS)
// ─────────────────────────────────────────────────────────────────────────────

async function persistAlerts(alerts) {
  if (!alerts.length) return [];
  const newAlerts = [];
  for (const alert of alerts) {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('market_alerts')
        .upsert(alert, { onConflict: 'external_id', ignoreDuplicates: true })
        .select();
      if (error) {
        console.error('[Alerts] Supabase upsert error:', error.message);
      } else if (data && data.length > 0) {
        newAlerts.push(data[0]);
      }
    } catch (err) {
      console.error('[Alerts] persistAlerts error:', err.message);
    }
  }
  return newAlerts;
}

async function getRecentAlerts({ limit = 50, category = null, urgency = null, offsetMinutes = 1440 } = {}) {
  const cutoff = new Date(Date.now() - offsetMinutes * 60 * 1000).toISOString();
  const supabase = getSupabase();
  let query = supabase
    .from('market_alerts')
    .select('*')
    .gt('created_at', cutoff)
    .eq('is_dismissed', false)
    .order('urgency_score', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);
  if (category) query = query.eq('category', category.toUpperCase());
  if (urgency) query = query.eq('urgency', urgency.toUpperCase());
  const { data, error } = await query;
  if (error) {
    console.error('[Alerts] getRecentAlerts error:', error.message);
    throw new Error(error.message);
  }
  return data || [];
}

async function getUnreadCount() {
  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count, error } = await getSupabase()
      .from('market_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false)
      .eq('urgency', 'HIGH')
      .gt('created_at', cutoff);
    if (error) return 0;
    return count || 0;
  } catch {
    return 0;
  }
}

async function markAsRead(ids) {
  if (!ids?.length) return;
  const { error } = await getSupabase()
    .from('market_alerts')
    .update({ is_read: true })
    .in('id', ids);
  if (error) {
    console.error('[Alerts] markAsRead error:', error.message);
    throw new Error(error.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Poll Loop
// ─────────────────────────────────────────────────────────────────────────────

let pollIntervalId = null;
let isPolling = false;
let tableCheckDone = false;
let tableExists = false;

async function checkTableExists() {
  if (tableCheckDone) return tableExists;
  try {
    const { error } = await getSupabase().from('market_alerts').select('id').limit(1);
    if (error) {
      if (error.code === '42P01' || (error.message && error.message.includes('does not exist'))) {
        console.warn('[Alerts] market_alerts table not found — polling disabled. Run migrations to enable.');
      } else {
        console.error('[Alerts] Supabase connection error during table check:', error.message);
      }
      tableExists = false;
    } else {
      tableExists = true;
    }
  } catch (err) {
    console.error('[Alerts] Exception during table check:', err.message);
    tableExists = false;
  }
  tableCheckDone = true;
  return tableExists;
}

async function runPollCycle() {
  if (isPolling) return;
  isPolling = true;
  if (!(await checkTableExists())) { isPolling = false; return; }
  try {
    console.info('[Alerts] Running poll cycle…');
    let articles;
    try {
      articles = await rss.getAggregatedNews({ limit: 100, minImpact: 2 });
    } catch (err) {
      console.warn('[Alerts] RSS fetch failed:', err.message);
      isPolling = false;
      return;
    }
    const candidates = articles.map(transformToAlert).filter(Boolean);
    if (candidates.length === 0) {
      console.info('[Alerts] No qualifying alerts in this cycle.');
      isPolling = false;
      return;
    }
    const newAlerts = await persistAlerts(candidates);
    if (newAlerts.length > 0) {
      console.info(`[Alerts] Persisted ${newAlerts.length} new alert(s). Broadcasting…`);
      const sorted = newAlerts.sort((a, b) => {
        const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
        return order[a.urgency] - order[b.urgency];
      });
      sorted.forEach(broadcastAlert);
    } else {
      console.info('[Alerts] All articles already processed (deduped).');
    }
  } catch (err) {
    console.error('[Alerts] Poll cycle error:', err.message);
  } finally {
    isPolling = false;
  }
}

function startPolling(intervalMs = 5 * 60 * 1000) {
  if (pollIntervalId) { console.warn('[Alerts] Poll loop already running.'); return; }
  console.info(`[Alerts] Starting poll loop (interval: ${intervalMs / 1000}s)`);
  runPollCycle();
  pollIntervalId = setInterval(runPollCycle, intervalMs);
}

function stopPolling() {
  if (pollIntervalId) {
    clearInterval(pollIntervalId);
    pollIntervalId = null;
    console.info('[Alerts] Poll loop stopped.');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// User Subscription CRUD
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_SUBSCRIPTION = {
  categories: ['POLITICAL', 'FED', 'ECONOMIC', 'EARNINGS', 'BREAKING'],
  urgencies: ['HIGH', 'MEDIUM'],
  sound_enabled: true,
  email_enabled: false,
  push_enabled: true,
};

async function getSubscription(userId) {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('alert_subscriptions')
      .select('*')
      .eq('user_id', userId);
    if (error) throw new Error(error.message);
    if (data && data.length > 0) return data[0];
    // Auto-create defaults
    const { data: inserted, error: insertErr } = await supabase
      .from('alert_subscriptions')
      .insert({
        user_id: userId,
        categories: DEFAULT_SUBSCRIPTION.categories,
        urgencies: DEFAULT_SUBSCRIPTION.urgencies,
        sound_enabled: DEFAULT_SUBSCRIPTION.sound_enabled,
        email_enabled: DEFAULT_SUBSCRIPTION.email_enabled,
        push_enabled: DEFAULT_SUBSCRIPTION.push_enabled,
      })
      .select()
      .single();
    if (insertErr) throw new Error(insertErr.message);
    return inserted;
  } catch (err) {
    console.error('[Alerts] getSubscription error:', err.message);
    throw err;
  }
}

async function upsertSubscription(userId, prefs) {
  const {
    categories = DEFAULT_SUBSCRIPTION.categories,
    urgencies = DEFAULT_SUBSCRIPTION.urgencies,
    sound_enabled = true,
    email_enabled = false,
    push_enabled = true,
  } = prefs;
  const { data, error } = await getSupabase()
    .from('alert_subscriptions')
    .upsert(
      { user_id: userId, categories, urgencies, sound_enabled, email_enabled, push_enabled, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

module.exports = {
  registerSSEClient,
  broadcastAlert,
  getSSEClientCount: () => sseClients.size,
  classifyCategory,
  scoreUrgency,
  transformToAlert,
  persistAlerts,
  getRecentAlerts,
  getUnreadCount,
  markAsRead,
  getSubscription,
  upsertSubscription,
  startPolling,
  stopPolling,
  runPollCycle,
  CATEGORY_KEYWORDS,
  HIGH_URGENCY_KEYWORDS,
};
