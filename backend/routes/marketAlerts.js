/**
 * Market Alerts Router
 *
 * GET /api/alerts/market    — active price-move alerts (last 60 min)
 * GET /api/alerts/calendar  — upcoming high-impact economic events (next 2 h)
 */

'use strict';

const express      = require('express');
const router       = express.Router();
const marketAlerts = require('../services/marketAlerts');

// ─── GET /market ──────────────────────────────────────────────────────────────

router.get('/market', async (req, res) => {
  try {
    const alerts = marketAlerts.getActiveAlerts();

    res.set('Cache-Control', 'public, max-age=30'); // Fresh within 30s
    return res.json({
      success:   true,
      count:     alerts.length,
      data:      alerts,
      symbols:   marketAlerts.ALERT_SYMBOLS,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[MarketAlerts] GET /market error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch market alerts' });
  }
});

// ─── GET /calendar ────────────────────────────────────────────────────────────

router.get('/calendar', async (req, res) => {
  try {
    const hours  = Math.min(parseInt(req.query.hours || '2', 10), 12);
    const events = await marketAlerts.getUpcomingHighImpactEvents(hours);

    res.set('Cache-Control', 'public, max-age=60');
    return res.json({
      success:   true,
      count:     events.length,
      data:      events,
      hours,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[MarketAlerts] GET /calendar error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch upcoming events' });
  }
});

module.exports = router;
