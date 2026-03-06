/**
 * Economic Calendar Route Tests
 * 
 * TDD: Tests written first to define expected behavior.
 * Covers: GET /api/calendar/today, /api/calendar/upcoming, /api/calendar/high-impact
 * 
 * Mocks the economicCalendar service to isolate route logic.
 */

const request = require('supertest');
const express = require('express');

// Mock the economic calendar service
jest.mock('../services/economicCalendar', () => ({
  getUpcomingEvents: jest.fn(),
  getTodaysEvents: jest.fn(),
  getHighImpactEvents: jest.fn(),
  getMacroSnapshot: jest.fn(),
}));

const economicCalendar = require('../services/economicCalendar');

function buildTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/calendar', require('../routes/calendar'));
  return app;
}

const mockEvents = [
  {
    id: 'evt-001',
    title: 'US CPI (YoY)',
    currency: 'USD',
    impact: 3,
    date: new Date().toISOString(),
    actual: '3.2%',
    forecast: '3.1%',
    previous: '3.4%',
    source: 'forexfactory'
  },
  {
    id: 'evt-002',
    title: 'ECB Interest Rate Decision',
    currency: 'EUR',
    impact: 3,
    date: new Date().toISOString(),
    actual: null,
    forecast: '4.50%',
    previous: '4.50%',
    source: 'forexfactory'
  }
];

// ──────────────────────────────────────────
// GET /api/calendar/today
// ──────────────────────────────────────────

describe('GET /api/calendar/today', () => {
  let app;
  beforeEach(() => { app = buildTestApp(); });
  afterEach(() => jest.clearAllMocks());

  test('returns today\'s events with success envelope', async () => {
    economicCalendar.getTodaysEvents.mockResolvedValueOnce(mockEvents);

    const res = await request(app).get('/api/calendar/today');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(2);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.date).toBeDefined();
    expect(res.body.timestamp).toBeDefined();
  });

  test('filters by currency when ?currencies= is passed', async () => {
    economicCalendar.getTodaysEvents.mockResolvedValueOnce(
      mockEvents.filter(e => e.currency === 'USD')
    );

    const res = await request(app).get('/api/calendar/today?currencies=USD');

    expect(res.status).toBe(200);
    // Verify the service was called with the currency filter
    expect(economicCalendar.getTodaysEvents).toHaveBeenCalledWith(
      expect.objectContaining({ currencies: ['USD'] })
    );
  });

  test('returns empty array when no events today', async () => {
    economicCalendar.getTodaysEvents.mockResolvedValueOnce([]);

    const res = await request(app).get('/api/calendar/today');
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
    expect(res.body.data).toEqual([]);
  });

  test('returns 500 on service error', async () => {
    economicCalendar.getTodaysEvents.mockRejectedValueOnce(new Error('Feed unavailable'));

    const res = await request(app).get('/api/calendar/today');
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

// ──────────────────────────────────────────
// GET /api/calendar/upcoming
// ──────────────────────────────────────────

describe('GET /api/calendar/upcoming', () => {
  let app;
  beforeEach(() => { app = buildTestApp(); });
  afterEach(() => jest.clearAllMocks());

  test('returns upcoming events for default 7 days', async () => {
    economicCalendar.getUpcomingEvents.mockResolvedValueOnce(mockEvents);

    const res = await request(app).get('/api/calendar/upcoming');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(economicCalendar.getUpcomingEvents).toHaveBeenCalledWith(
      expect.objectContaining({ days: 7 })
    );
  });

  test('respects ?days= parameter', async () => {
    economicCalendar.getUpcomingEvents.mockResolvedValueOnce(mockEvents);

    await request(app).get('/api/calendar/upcoming?days=14');

    expect(economicCalendar.getUpcomingEvents).toHaveBeenCalledWith(
      expect.objectContaining({ days: 14 })
    );
  });

  test('caps days at 30 to prevent abuse', async () => {
    economicCalendar.getUpcomingEvents.mockResolvedValueOnce(mockEvents);

    await request(app).get('/api/calendar/upcoming?days=999');

    expect(economicCalendar.getUpcomingEvents).toHaveBeenCalledWith(
      expect.objectContaining({ days: 30 })
    );
  });

  test('respects ?minImpact= filter', async () => {
    economicCalendar.getUpcomingEvents.mockResolvedValueOnce([mockEvents[0]]);

    const res = await request(app).get('/api/calendar/upcoming?minImpact=3');

    expect(res.status).toBe(200);
    expect(economicCalendar.getUpcomingEvents).toHaveBeenCalledWith(
      expect.objectContaining({ minImpact: 3 })
    );
  });

  test('passes multiple currency filters', async () => {
    economicCalendar.getUpcomingEvents.mockResolvedValueOnce(mockEvents);

    await request(app).get('/api/calendar/upcoming?currencies=USD,EUR');

    expect(economicCalendar.getUpcomingEvents).toHaveBeenCalledWith(
      expect.objectContaining({ currencies: ['USD', 'EUR'] })
    );
  });

  test('returns 500 on service error', async () => {
    economicCalendar.getUpcomingEvents.mockRejectedValueOnce(new Error('Service down'));

    const res = await request(app).get('/api/calendar/upcoming');
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

// ──────────────────────────────────────────
// GET /api/calendar/high-impact
// ──────────────────────────────────────────

describe('GET /api/calendar/high-impact', () => {
  let app;
  beforeEach(() => { app = buildTestApp(); });
  afterEach(() => jest.clearAllMocks());

  test('returns only high-impact events', async () => {
    const highImpactOnly = mockEvents.filter(e => e.impact === 3);
    economicCalendar.getHighImpactEvents.mockResolvedValueOnce(highImpactOnly);

    const res = await request(app).get('/api/calendar/high-impact');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.every(e => e.impact === 3)).toBe(true);
  });

  test('caps days at 14', async () => {
    economicCalendar.getHighImpactEvents.mockResolvedValueOnce([]);

    await request(app).get('/api/calendar/high-impact?days=100');

    expect(economicCalendar.getHighImpactEvents).toHaveBeenCalledWith(
      expect.objectContaining({ days: 14 })
    );
  });

  test('defaults to 3 days', async () => {
    economicCalendar.getHighImpactEvents.mockResolvedValueOnce([]);

    await request(app).get('/api/calendar/high-impact');

    expect(economicCalendar.getHighImpactEvents).toHaveBeenCalledWith(
      expect.objectContaining({ days: 3 })
    );
  });
});
