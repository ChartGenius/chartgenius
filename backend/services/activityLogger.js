/**
 * activityLogger.js — Log user actions to activity_log table via Supabase REST
 */
const { createClient } = require('@supabase/supabase-js');

function getClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

/**
 * Log an activity. Non-throwing — errors are swallowed to never block the main request.
 * @param {string|null} userId
 * @param {string|null} email
 * @param {string} action  e.g. 'login', 'signup', 'sync_push', 'sync_pull', 'export', 'feedback_submit', 'password_reset', 'login_failed', 'page_view'
 * @param {object} details  arbitrary JSON details
 * @param {string|null} ip
 * @param {string|null} userAgent
 */
async function logActivity(userId, email, action, details = {}, ip = null, userAgent = null) {
  try {
    const supabase = getClient();
    if (!supabase) return;

    const row = {
      action,
      details: details || {},
      ...(userId && { user_id: userId }),
      ...(email && { email }),
      ...(ip && { ip_address: ip }),
      ...(userAgent && { user_agent: userAgent }),
    };

    const { error } = await supabase.from('activity_log').insert(row);
    if (error) console.warn('[activityLogger] Insert error:', error.message);
  } catch (e) {
    // Never crash caller
    console.warn('[activityLogger] Unexpected error:', e.message);
  }
}

/**
 * Express middleware helper: extract IP from request.
 */
function getIP(req) {
  return (
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    null
  );
}

module.exports = { logActivity, getIP };
