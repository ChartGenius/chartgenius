/**
 * Alert Service & Routes Tests
 *
 * TDD: Tests define expected behavior.
 * Covers:
 *   - classifyCategory()
 *   - scoreUrgency()
 *   - transformToAlert()
 *   - GET /api/alerts
 *   - GET /api/alerts/live (SSE headers)
 *   - POST /api/alerts/subscribe
 *   - GET /api/alerts/count
 *
 * Mocks: db, rssFeedAggregator (no live network/DB calls)
 */

const request = require('supertest');
const express = require('express');

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('../services/db', () => ({
  query: jest.fn(),
}));

jest.mock('../services/rssFeedAggregator', () => ({
  getAggregatedNews: jest.fn(),
}));

// Import AFTER mocks
const db = require('../services/db');
const {
  classifyCategory,
  scoreUrgency,
  transformToAlert,
  CATEGORY_KEYWORDS,
  HIGH_URGENCY_KEYWORDS,
} = require('../services/alertService');

const alertsRouter = require('../routes/alerts');

const app = express();
app.use(express.json());

// Mock auth middleware (inject user for protected routes)
app.use((req, res, next) => {
  req.user = req.headers['x-test-user']
    ? JSON.parse(req.headers['x-test-user'])
    : null;
  next();
});

app.use('/api/alerts', alertsRouter);

afterEach(() => jest.clearAllMocks());

// ─────────────────────────────────────────────────────────────────────────────
// classifyCategory()
// ─────────────────────────────────────────────────────────────────────────────

describe('classifyCategory()', () => {
  test('classifies Fed-related text as FED', () => {
    const { category } = classifyCategory('the fomc meeting signals rate hike next quarter');
    expect(category).toBe('FED');
  });

  test('classifies Trump tariff text as POLITICAL', () => {
    const { category } = classifyCategory('trump announces new tariff on chinese goods');
    expect(category).toBe('POLITICAL');
  });

  test('classifies jobs report as ECONOMIC', () => {
    const { category } = classifyCategory('nonfarm payroll jobs report beats expectations');
    expect(category).toBe('ECONOMIC');
  });

  test('classifies earnings beat as EARNINGS', () => {
    const { category } = classifyCategory('apple q3 results earnings eps beat analyst forecast');
    expect(category).toBe('EARNINGS');
  });

  test('defaults to BREAKING when no keywords match but impact is assigned', () => {
    const { category, keywordsHit } = classifyCategory('market update today mid-afternoon session');
    expect(category).toBe('BREAKING');
    expect(keywordsHit).toHaveLength(0);
  });

  test('returns matched keywords in keywordsHit', () => {
    const { keywordsHit } = classifyCategory('federal reserve rate hike powell remarks');
    expect(keywordsHit.length).toBeGreaterThan(0);
    expect(keywordsHit).toContain('powell');
  });

  test('prefers FED over POLITICAL when both match (priority)', () => {
    // "federal reserve" is FED, "tariff" is POLITICAL — FED has priority
    const { category } = classifyCategory('federal reserve tariff impact on monetary policy');
    expect(category).toBe('FED');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// scoreUrgency()
// ─────────────────────────────────────────────────────────────────────────────

describe('scoreUrgency()', () => {
  test('returns HIGH for FOMC keyword hit', () => {
    const { urgency } = scoreUrgency('fomc emergency meeting', ['fomc'], 9);
    expect(urgency).toBe('HIGH');
  });

  test('returns HIGH for high RSS impact score alone', () => {
    const { urgency } = scoreUrgency('some market event', ['tariff'], 9);
    expect(urgency).toBe('HIGH');
  });

  test('returns MEDIUM for moderate keyword match', () => {
    const { urgency } = scoreUrgency('central bank guidance', ['central bank', 'bond market'], 3);
    expect(urgency).toBe('MEDIUM');
  });

  test('returns LOW for minimal signal', () => {
    const { urgency } = scoreUrgency('tech stocks', [], 1);
    expect(urgency).toBe('LOW');
  });

  test('urgencyScore is a non-negative number', () => {
    const { urgencyScore } = scoreUrgency('inflation cpi data', ['inflation', 'cpi'], 7);
    expect(urgencyScore).toBeGreaterThanOrEqual(0);
    expect(urgencyScore).toBeLessThanOrEqual(100);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// transformToAlert()
// ─────────────────────────────────────────────────────────────────────────────

describe('transformToAlert()', () => {
  const mockArticle = {
    id: 'article-xyz',
    title: 'Federal Reserve Raises Rates by 25 Basis Points',
    summary: 'FOMC vote is unanimous. Fed rate now at 5.5%. Powell press conference scheduled.',
    url: 'https://reuters.com/fed-rate',
    source: 'Reuters Business',
    impactScore: 9.2,
    sentimentScore: -0.1,
    sentimentLabel: 'neutral',
    symbols: ['SPY', 'TLT'],
    tags: ['fed', 'rates'],
    publishedAt: '2025-09-01T14:00:00.000Z',
  };

  test('transforms a high-impact article into an alert object', () => {
    const alert = transformToAlert(mockArticle);
    expect(alert).not.toBeNull();
    expect(alert.title).toBe(mockArticle.title);
    expect(alert.category).toBe('FED');
    expect(alert.urgency).toBe('HIGH');
    expect(alert.external_id).toBe('article-xyz');
  });

  test('includes keywords_hit array', () => {
    const alert = transformToAlert(mockArticle);
    expect(Array.isArray(alert.keywords_hit)).toBe(true);
    expect(alert.keywords_hit.length).toBeGreaterThan(0);
  });

  test('returns null for low-impact non-matching articles', () => {
    const lowImpact = {
      id: 'low-xyz',
      title: 'Company X launches new website',
      summary: 'A technology company updated its website.',
      impactScore: 1.0,
      sentimentScore: 0,
      sentimentLabel: 'neutral',
      symbols: [],
      tags: [],
      publishedAt: new Date().toISOString(),
      source: 'BlogPost',
    };
    const result = transformToAlert(lowImpact);
    expect(result).toBeNull();
  });

  test('preserves symbols and tags from original article', () => {
    const alert = transformToAlert(mockArticle);
    expect(alert.symbols).toContain('SPY');
    expect(alert.symbols).toContain('TLT');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/alerts
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/alerts', () => {
  const MOCK_ALERTS = [
    {
      id: 1,
      title: 'Fed Raises Rates',
      category: 'FED',
      urgency: 'HIGH',
      urgency_score: 85,
      source: 'Reuters',
      published_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      is_read: false,
      keywords_hit: ['fomc', 'rate hike'],
      symbols: ['SPY'],
    },
    {
      id: 2,
      title: 'Trump Signs Tariff Order',
      category: 'POLITICAL',
      urgency: 'HIGH',
      urgency_score: 75,
      source: 'MarketWatch',
      published_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      is_read: false,
      keywords_hit: ['trump', 'tariff'],
      symbols: [],
    },
  ];

  test('returns 200 with alert list', async () => {
    db.query.mockResolvedValueOnce({ rows: MOCK_ALERTS });

    const res = await request(app).get('/api/alerts');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(2);
  });

  test('filters by category via query param', async () => {
    db.query.mockResolvedValueOnce({ rows: [MOCK_ALERTS[0]] });

    const res = await request(app).get('/api/alerts?category=FED');
    expect(res.status).toBe(200);
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('category ='),
      expect.arrayContaining(['FED'])
    );
  });

  test('filters by urgency via query param', async () => {
    db.query.mockResolvedValueOnce({ rows: MOCK_ALERTS });

    const res = await request(app).get('/api/alerts?urgency=HIGH');
    expect(res.status).toBe(200);
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('urgency ='),
      expect.arrayContaining(['HIGH'])
    );
  });

  test('returns empty array when no alerts', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/api/alerts');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  test('handles DB errors gracefully with 500', async () => {
    db.query.mockRejectedValueOnce(new Error('DB connection lost'));

    const res = await request(app).get('/api/alerts');
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/alerts/count
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/alerts/count', () => {
  test('returns unread HIGH count', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ count: '5' }] });

    const res = await request(app).get('/api/alerts/count');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(5);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/alerts/live (SSE)
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/alerts/live (SSE)', () => {
  test('returns SSE headers', done => {
    // SSE connections stay open; test the response headers via http directly
    const http = require('http');
    const server = app.listen(0, () => {
      const port = server.address().port;
      const req = http.get(`http://localhost:${port}/api/alerts/live`, res => {
        expect(res.headers['content-type']).toContain('text/event-stream');
        expect(res.headers['cache-control']).toContain('no-cache');
        req.destroy();
        server.close(done);
      });
      req.on('error', () => server.close(done));
    });
  }, 5000);
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/alerts/subscribe
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/alerts/subscribe', () => {
  const MOCK_SUBSCRIPTION = {
    id: 1,
    user_id: 42,
    categories: ['FED', 'ECONOMIC'],
    urgencies: ['HIGH'],
    sound_enabled: true,
    email_enabled: false,
    push_enabled: true,
  };

  test('requires authentication', async () => {
    const res = await request(app)
      .post('/api/alerts/subscribe')
      .send({ categories: ['FED'] });

    expect(res.status).toBe(401);
  });

  test('saves subscription for authenticated user', async () => {
    db.query.mockResolvedValueOnce({ rows: [MOCK_SUBSCRIPTION] });

    const res = await request(app)
      .post('/api/alerts/subscribe')
      .set('x-test-user', JSON.stringify({ id: 42, email: 'test@example.com' }))
      .send({
        categories: ['FED', 'ECONOMIC'],
        urgencies: ['HIGH'],
        sound_enabled: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });

  test('validates categories array contains valid values', async () => {
    const res = await request(app)
      .post('/api/alerts/subscribe')
      .set('x-test-user', JSON.stringify({ id: 42 }))
      .send({ categories: ['INVALID_CATEGORY'] });

    expect(res.status).toBe(400);
  });

  test('validates urgencies array', async () => {
    const res = await request(app)
      .post('/api/alerts/subscribe')
      .set('x-test-user', JSON.stringify({ id: 42 }))
      .send({ urgencies: ['CRITICAL'] }); // not a valid urgency

    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/alerts/read
// ─────────────────────────────────────────────────────────────────────────────

describe('PATCH /api/alerts/read', () => {
  test('marks alerts as read', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .patch('/api/alerts/read')
      .set('x-test-user', JSON.stringify({ id: 42, email: 'test@example.com' }))
      .send({ ids: [1, 2, 3] });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('returns 400 for missing ids', async () => {
    const res = await request(app)
      .patch('/api/alerts/read')
      .set('x-test-user', JSON.stringify({ id: 42, email: 'test@example.com' }))
      .send({});

    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Keyword coverage sanity checks
// ─────────────────────────────────────────────────────────────────────────────

describe('CATEGORY_KEYWORDS coverage', () => {
  test('all categories have keywords', () => {
    const cats = ['POLITICAL', 'FED', 'ECONOMIC', 'EARNINGS', 'BREAKING'];
    cats.forEach(cat => {
      expect(CATEGORY_KEYWORDS[cat].length).toBeGreaterThan(5);
    });
  });

  test('HIGH_URGENCY_KEYWORDS is a Set with entries', () => {
    expect(HIGH_URGENCY_KEYWORDS instanceof Set).toBe(true);
    expect(HIGH_URGENCY_KEYWORDS.size).toBeGreaterThan(10);
  });
});
