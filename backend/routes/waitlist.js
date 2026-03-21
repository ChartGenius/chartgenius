/**
 * Waitlist Routes
 *
 * POST /api/waitlist  - Sign up for early access
 * GET  /api/waitlist  - Admin: list signups (protected by admin key)
 *
 * NOTE: Migrated from db.query (direct Postgres/IPv6) to Supabase REST
 * (HTTPS/IPv4) to fix intermittent connectivity issues on Render.
 */

const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

// ── POST /api/waitlist ────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const {
    email,
    first_name,
    trade_type,
    experience,
    wants_telegram = false,
    wants_discord  = false,
  } = req.body;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email is required.' });
  }

  const emailTrimmed = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailTrimmed)) {
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('waitlist')
      .upsert(
        {
          email: emailTrimmed,
          first_name: first_name?.trim() || null,
          trade_type: trade_type || null,
          experience: experience || null,
          wants_telegram: !!wants_telegram,
          wants_discord: !!wants_discord,
          ip_address: req.ip || null,
        },
        { onConflict: 'email', ignoreDuplicates: true }
      )
      .select('id,created_at');

    if (error) throw error;

    if (!data || data.length === 0) {
      return res.json({ success: true, already_registered: true });
    }

    return res.json({
      success: true,
      already_registered: false,
      id: data[0].id,
    });
  } catch (err) {
    console.error('[waitlist] insert error:', err.message);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ── GET /api/waitlist (admin only) ────────────────────────────────────────
router.get('/', async (req, res) => {
  const adminKey = req.headers['x-admin-key'];
  if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { data, error } = await getSupabase()
      .from('waitlist')
      .select('id,email,first_name,trade_type,experience,wants_telegram,wants_discord,created_at')
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) throw error;
    return res.json({ count: (data || []).length, signups: data || [] });
  } catch (err) {
    console.error('[waitlist] fetch error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch waitlist.' });
  }
});

module.exports = router;
