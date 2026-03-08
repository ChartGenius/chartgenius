/**
 * Market Movers API Routes
 * 
 * GET /api/market-movers           - Get recent high-impact news
 * GET /api/market-movers/scan      - Trigger a scan (internal/cron use)
 * GET /api/market-movers/stats     - Bot statistics
 */

const express = require('express');
const router = express.Router();
const marketMoverBot = require('../services/marketMoverBot');

// GET /api/market-movers?limit=20&hours=4
router.get('/', async (req, res) => {
  try {
    const { limit = 20, hours = 4 } = req.query;

    const movers = await marketMoverBot.getRecentMovers({
      limit: Math.min(parseInt(limit) || 20, 50),
      hours: Math.min(parseFloat(hours) || 4, 24)
    });

    res.json({
      success: true,
      count: movers.length,
      data: movers,
      sources: [...new Set(movers.map(a => a.source))],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[MarketMovers] Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch market movers' });
  }
});

// GET /api/market-movers/scan?threshold=7&maxAge=30
// Internal endpoint for cron/manual triggering
router.get('/scan', async (req, res) => {
  try {
    const { threshold = 7, maxAge = 30 } = req.query;

    const result = await marketMoverBot.scan({
      impactThreshold: parseFloat(threshold) || 7,
      maxAge: parseInt(maxAge) || 30
    });

    // Format alerts if any found
    const alerts = result.articles.map(article => ({
      ...article,
      formatted: marketMoverBot.formatAlert(article)
    }));

    res.json({
      success: true,
      found: result.found,
      alerts,
      meta: {
        scannedFeeds: result.scannedFeeds,
        scanDuration: `${result.scanDuration}ms`,
        timestamp: result.timestamp
      }
    });
  } catch (error) {
    console.error('[MarketMovers] Scan error:', error);
    res.status(500).json({ success: false, error: 'Scan failed' });
  }
});

// GET /api/market-movers/stats
router.get('/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      lastRun: marketMoverBot.lastRun,
      seenArticles: marketMoverBot.seenArticles.size,
      feedCount: 7  // Number of priority feeds
    }
  });
});

module.exports = router;
