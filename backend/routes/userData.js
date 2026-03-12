/**
 * User Data Sync Routes — cloud save/load for authenticated users
 *
 * GET  /api/user/data              - Get all user data (journal, portfolio, settings, watchlist)
 * PUT  /api/user/data              - Save all user data (full sync)
 * GET  /api/user/data/:type        - Get specific data type
 * PUT  /api/user/data/:type        - Save specific data type
 *
 * Supported data types: journal | portfolio | settings | watchlist
 *
 * All routes require auth (JWT validated by middleware → req.user.id).
 * Uses direct SQL via db.query (bypasses Supabase RLS, but auth middleware
 * ensures req.user.id is valid and queries filter by it).
 *
 * Data model: user_data table — one row per user per data_type.
 * See migrations/010_user_data.sql for schema.
 */

const express = require('express');
const router = express.Router();
const db = require('../services/db');
const { requireAuth } = require('../middleware/auth');

// ── Constants ─────────────────────────────────────────────────────────────────
const VALID_TYPES = ['journal', 'portfolio', 'settings', 'watchlist'];

// ── GET /api/user/data — fetch ALL data types ─────────────────────────────────
router.get('/data', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const { rows } = await db.query(
      'SELECT data_type, data, updated_at FROM user_data WHERE user_id = $1',
      [userId]
    );

    const result = { journal: null, portfolio: null, settings: null, watchlist: null };
    const meta = {};

    rows.forEach(row => {
      result[row.data_type] = row.data;
      meta[row.data_type] = { updated_at: row.updated_at };
    });

    res.json({ data: result, meta });
  } catch (err) {
    console.error('[UserData] Fetch all error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── PUT /api/user/data — full sync (all types at once) ────────────────────────
router.put('/data', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const body = req.body;

    const toSave = {};
    for (const type of VALID_TYPES) {
      if (body[type] !== undefined) {
        if (typeof body[type] !== 'object') {
          return res.status(400).json({ error: `${type} must be an object` });
        }
        toSave[type] = body[type];
      }
    }

    if (Object.keys(toSave).length === 0) {
      return res.status(400).json({ error: 'No valid data types provided', validTypes: VALID_TYPES });
    }

    const upserts = Object.entries(toSave).map(([type, payload]) =>
      db.query(
        `INSERT INTO user_data (user_id, data_type, data, updated_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (user_id, data_type)
         DO UPDATE SET data = $3, updated_at = NOW()`,
        [userId, type, JSON.stringify(payload)]
      )
    );

    await Promise.all(upserts);

    res.json({
      message: 'Data saved successfully',
      saved: Object.keys(toSave),
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[UserData] Full sync error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /api/user/data/:type — fetch a specific data type ─────────────────────
router.get('/data/:type', requireAuth, async (req, res) => {
  try {
    const { type } = req.params;

    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({ error: `Invalid data type: ${type}`, validTypes: VALID_TYPES });
    }

    const userId = req.user.id;

    const { rows } = await db.query(
      'SELECT data, updated_at FROM user_data WHERE user_id = $1 AND data_type = $2',
      [userId, type]
    );

    if (rows.length === 0) {
      return res.json({ type, data: null, updated_at: null });
    }

    res.json({ type, data: rows[0].data, updated_at: rows[0].updated_at });
  } catch (err) {
    console.error(`[UserData] Fetch ${req.params.type} error:`, err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── PUT /api/user/data/:type — save a specific data type ──────────────────────
router.put('/data/:type', requireAuth, async (req, res) => {
  try {
    const { type } = req.params;

    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({ error: `Invalid data type: ${type}`, validTypes: VALID_TYPES });
    }

    if (typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({ error: 'Request body must be a JSON object' });
    }

    const userId = req.user.id;

    await db.query(
      `INSERT INTO user_data (user_id, data_type, data, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id, data_type)
       DO UPDATE SET data = $3, updated_at = NOW()`,
      [userId, type, JSON.stringify(req.body)]
    );

    res.json({
      message: `${type} saved successfully`,
      type,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error(`[UserData] Save ${req.params.type} error:`, err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
