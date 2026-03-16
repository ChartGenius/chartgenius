/**
 * Push Notification Routes
 *
 * POST /api/push/subscribe    — Save push subscription to Supabase
 * POST /api/push/unsubscribe  — Remove push subscription
 * POST /api/push/test         — Send a test notification (auth required, rate-limited)
 *
 * Requires env vars:
 *   VAPID_PUBLIC_KEY
 *   VAPID_PRIVATE_KEY
 *   VAPID_SUBJECT
 */

'use strict';

const express = require('express');
const router = express.Router();
const webPush = require('web-push');
const rateLimit = require('express-rate-limit');
const { requireAuth } = require('../middleware/auth');
const { createClient } = require('@supabase/supabase-js');

// ─── VAPID Setup ──────────────────────────────────────────────────────────────

const VAPID_PUBLIC_KEY  = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT     = process.env.VAPID_SUBJECT || 'mailto:support@tradvue.com';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} else {
  console.warn('[PushRoutes] VAPID keys not set — push notifications disabled');
}

// ─── Supabase ────────────────────────────────────────────────────────────────

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  );
}

// ─── Rate Limiters ────────────────────────────────────────────────────────────

// Test endpoint: max 3 test notifications per user per 10 minutes
const testRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: { error: 'Too many test notifications. Please wait 10 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Subscribe/unsubscribe: max 10 per 5 minutes
const subRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: { error: 'Too many subscription requests.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Validates a push subscription object shape.
 */
function isValidSubscription(sub) {
  return (
    sub &&
    typeof sub === 'object' &&
    typeof sub.endpoint === 'string' &&
    sub.endpoint.startsWith('https://') &&
    sub.keys &&
    typeof sub.keys.p256dh === 'string' &&
    typeof sub.keys.auth === 'string'
  );
}

// ─── Routes ──────────────────────────────────────────────────────────────────

/**
 * POST /api/push/subscribe
 * Body: { subscription: PushSubscription, notificationTime?: string }
 * Auth: required
 */
router.post('/subscribe', requireAuth, subRateLimit, async (req, res) => {
  const { subscription, notificationTime } = req.body;

  if (!isValidSubscription(subscription)) {
    return res.status(400).json({ error: 'Invalid push subscription object.' });
  }

  if (!VAPID_PUBLIC_KEY) {
    return res.status(503).json({ error: 'Push notifications not configured on server.' });
  }

  try {
    const supabase = getSupabase();
    const userId = req.user.id;

    // Upsert subscription keyed by user + endpoint
    // Table: push_subscriptions (user_id, endpoint, p256dh, auth, notification_time, active)
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert(
        {
          user_id: userId,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          notification_time: notificationTime || '16:05',
          active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,endpoint' }
      );

    if (error) {
      console.error('[PushRoutes] Supabase upsert error:', error.message);
      return res.status(500).json({ error: 'Failed to save subscription.' });
    }

    res.json({ success: true, message: 'Push subscription saved.' });
  } catch (err) {
    console.error('[PushRoutes] subscribe error:', err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * POST /api/push/unsubscribe
 * Body: { endpoint: string }
 * Auth: required
 */
router.post('/unsubscribe', requireAuth, subRateLimit, async (req, res) => {
  const { endpoint } = req.body;

  if (!endpoint || typeof endpoint !== 'string') {
    return res.status(400).json({ error: 'Endpoint required.' });
  }

  try {
    const supabase = getSupabase();

    const { error } = await supabase
      .from('push_subscriptions')
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq('user_id', req.user.id)
      .eq('endpoint', endpoint);

    if (error) {
      console.error('[PushRoutes] Supabase unsubscribe error:', error.message);
      return res.status(500).json({ error: 'Failed to remove subscription.' });
    }

    res.json({ success: true, message: 'Unsubscribed from push notifications.' });
  } catch (err) {
    console.error('[PushRoutes] unsubscribe error:', err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * POST /api/push/test
 * Send a test notification to all active subscriptions for the current user.
 * Auth: required | Rate-limited: 3/10 min
 */
router.post('/test', requireAuth, testRateLimit, async (req, res) => {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return res.status(503).json({ error: 'Push notifications not configured on server.' });
  }

  try {
    const supabase = getSupabase();

    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', req.user.id)
      .eq('active', true);

    if (error) {
      console.error('[PushRoutes] Supabase select error:', error.message);
      return res.status(500).json({ error: 'Failed to fetch subscriptions.' });
    }

    if (!subs || subs.length === 0) {
      return res.status(404).json({ error: 'No active push subscriptions found.' });
    }

    const payload = JSON.stringify({
      title: 'TradVue — Test Notification 🔔',
      body: "📊 Market's closed — ready to log today's trades?",
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      url: '/ritual',
      tag: 'test-notification',
    });

    const results = await Promise.allSettled(
      subs.map((sub) =>
        webPush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload
        )
      )
    );

    const sent = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    // Mark expired subscriptions as inactive
    const expiredEndpoints = [];
    subs.forEach((sub, i) => {
      const result = results[i];
      if (result.status === 'rejected') {
        const statusCode = result.reason?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          expiredEndpoints.push(sub.endpoint);
        }
      }
    });

    if (expiredEndpoints.length > 0) {
      await supabase
        .from('push_subscriptions')
        .update({ active: false })
        .in('endpoint', expiredEndpoints);
    }

    res.json({
      success: true,
      sent,
      failed,
      message: `Test notification sent to ${sent} device(s).`,
    });
  } catch (err) {
    console.error('[PushRoutes] test error:', err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * GET /api/push/vapid-public-key
 * Returns the VAPID public key for the frontend to subscribe with.
 * No auth required — public key is safe to expose.
 */
router.get('/vapid-public-key', (req, res) => {
  if (!VAPID_PUBLIC_KEY) {
    return res.status(503).json({ error: 'Push notifications not configured.' });
  }
  res.json({ publicKey: VAPID_PUBLIC_KEY });
});

module.exports = router;
