/**
 * Backup Routes — Data export & restore
 * 
 * GET  /api/backup/export   — Export all user data (stub for server-side)
 * POST /api/backup/restore  — Restore from backup file (stub for server-side)
 * 
 * NOTE: Currently TradVue stores journal/portfolio data in localStorage.
 * These endpoints are stubs for when server-side storage is implemented.
 * The frontend handles exports/imports client-side for now.
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');

/**
 * GET /api/backup/export
 * When server-side storage is active, this will export all user data.
 */
router.get('/export', requireAuth, (req, res) => {
  res.json({
    message: 'Full backup export is handled client-side. Use the Backup button in the Journal page.',
    note: 'This endpoint will serve full exports when server-side storage is implemented.',
    supportedFormats: ['json'],
  });
});

/**
 * POST /api/backup/restore
 * When server-side storage is active, this will restore user data from backup.
 * Supports merge and replace modes.
 */
router.post('/restore', requireAuth, (req, res) => {
  const { mode, data } = req.body || {};
  
  if (!data) {
    return res.status(400).json({ error: 'No backup data provided' });
  }
  
  if (!data.version || !data.type) {
    return res.status(400).json({ error: 'Invalid backup format — missing version or type' });
  }
  
  // Validate structure
  const validTypes = ['full_backup', 'journal', 'portfolio'];
  if (!validTypes.includes(data.type)) {
    return res.status(400).json({ error: `Invalid backup type: ${data.type}. Expected: ${validTypes.join(', ')}` });
  }
  
  // Stub response
  res.json({
    message: 'Backup restore is handled client-side for now.',
    mode: mode || 'merge',
    type: data.type,
    note: 'This endpoint will process restores when server-side storage is implemented.',
  });
});

/**
 * GET /api/portfolio/export?format=json|csv
 * Portfolio export stub.
 */
router.get('/portfolio-export', requireAuth, (req, res) => {
  const format = (req.query.format || 'json').toLowerCase();
  res.json({
    message: 'Portfolio export is handled client-side.',
    format,
    note: 'This endpoint will serve exports when server-side portfolio storage is implemented.',
  });
});

module.exports = router;
