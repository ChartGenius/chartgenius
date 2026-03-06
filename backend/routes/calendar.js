/**
 * Economic Calendar Routes
 * GET /api/calendar/upcoming         - Events for next N days
 * GET /api/calendar/today            - Today's events
 * GET /api/calendar/high-impact      - High-impact events only (impact=3)
 * GET /api/calendar/macro            - Macro indicator snapshot (FRED data)
 */

const express = require('express');
const router = express.Router();
const economicCalendar = require('../services/economicCalendar');

// GET /api/calendar/upcoming?days=7&currencies=USD,EUR&minImpact=2
router.get('/upcoming', async (req, res) => {
  try {
    const { days = 7, currencies, minImpact = 1 } = req.query;

    const currencyList = currencies
      ? currencies.split(',').map(c => c.trim().toUpperCase())
      : null;

    const events = await economicCalendar.getUpcomingEvents({
      days: Math.min(parseInt(days) || 7, 30),
      currencies: currencyList,
      minImpact: parseInt(minImpact) || 1
    });

    res.json({
      success: true,
      count: events.length,
      data: events,
      filters: { days, currencies: currencyList, minImpact },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Calendar] /upcoming error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch calendar events' });
  }
});

// GET /api/calendar/today?currencies=USD
router.get('/today', async (req, res) => {
  try {
    const { currencies } = req.query;
    const currencyList = currencies
      ? currencies.split(',').map(c => c.trim().toUpperCase())
      : null;

    const events = await economicCalendar.getTodaysEvents({ currencies: currencyList });

    res.json({
      success: true,
      count: events.length,
      data: events,
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Calendar] /today error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch today\'s events' });
  }
});

// GET /api/calendar/high-impact?days=3
router.get('/high-impact', async (req, res) => {
  try {
    const { days = 3 } = req.query;

    const events = await economicCalendar.getHighImpactEvents({
      days: Math.min(parseInt(days) || 3, 14)
    });

    res.json({
      success: true,
      count: events.length,
      data: events,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Calendar] /high-impact error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch high-impact events' });
  }
});

// GET /api/calendar/macro - Macro snapshot (FRED indicators + upcoming high-impact)
router.get('/macro', async (req, res) => {
  try {
    const snapshot = await economicCalendar.getMacroSnapshot();
    res.json({
      success: true,
      data: snapshot,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Calendar] /macro error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch macro snapshot' });
  }
});

module.exports = router;
