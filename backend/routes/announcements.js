/**
 * Public Announcements Route
 * GET /api/announcements — returns the active announcement (if any)
 */
const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

function getClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

// GET /api/announcements
router.get('/', async (req, res) => {
  try {
    const supabase = getClient();
    if (!supabase) return res.json({ announcement: null });

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('announcements')
      .select('id, message, type, expires_at, created_at')
      .eq('active', true)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows

    res.json({ announcement: data || null });
  } catch (err) {
    console.error('[Announcements] GET error:', err);
    res.json({ announcement: null }); // Never break public pages
  }
});

module.exports = router;
