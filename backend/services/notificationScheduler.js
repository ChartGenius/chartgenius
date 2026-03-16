/**
 * Notification Scheduler — Post-Trade Ritual Reminder
 *
 * Fires at 4:05 PM ET every market day (Mon–Fri), skipping NYSE holidays.
 * Sends push notifications to all users who have active subscriptions.
 *
 * Requires env vars:
 *   VAPID_PUBLIC_KEY
 *   VAPID_PRIVATE_KEY
 *   VAPID_SUBJECT
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY (preferred) or SUPABASE_ANON_KEY
 */

'use strict';

const cron = require('node-cron');
const webPush = require('web-push');
const { createClient } = require('@supabase/supabase-js');

// ─── VAPID Setup ──────────────────────────────────────────────────────────────

let vapidConfigured = false;

function initVapid() {
  const pub  = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subj = process.env.VAPID_SUBJECT || 'mailto:support@tradvue.com';

  if (pub && priv) {
    webPush.setVapidDetails(subj, pub, priv);
    vapidConfigured = true;
    console.log('[NotificationScheduler] VAPID configured ✅');
  } else {
    console.warn('[NotificationScheduler] VAPID keys missing — scheduler disabled');
  }
}

// ─── NYSE Holiday List ────────────────────────────────────────────────────────
// Format: 'YYYY-MM-DD'
// Keep updated annually. Source: NYSE holiday schedule.

const NYSE_HOLIDAYS_2024 = [
  '2024-01-01', // New Year's Day
  '2024-01-15', // Martin Luther King Jr. Day
  '2024-02-19', // Presidents' Day
  '2024-03-29', // Good Friday
  '2024-05-27', // Memorial Day
  '2024-06-19', // Juneteenth
  '2024-07-04', // Independence Day
  '2024-09-02', // Labor Day
  '2024-11-28', // Thanksgiving
  '2024-12-25', // Christmas
];

const NYSE_HOLIDAYS_2025 = [
  '2025-01-01', // New Year's Day
  '2025-01-20', // Martin Luther King Jr. Day
  '2025-02-17', // Presidents' Day
  '2025-04-18', // Good Friday
  '2025-05-26', // Memorial Day
  '2025-06-19', // Juneteenth
  '2025-07-04', // Independence Day
  '2025-09-01', // Labor Day
  '2025-11-27', // Thanksgiving
  '2025-12-25', // Christmas
];

const NYSE_HOLIDAYS_2026 = [
  '2026-01-01', // New Year's Day
  '2026-01-19', // Martin Luther King Jr. Day
  '2026-02-16', // Presidents' Day
  '2026-04-03', // Good Friday
  '2026-05-25', // Memorial Day
  '2026-06-19', // Juneteenth
  '2026-07-03', // Independence Day (observed)
  '2026-09-07', // Labor Day
  '2026-11-26', // Thanksgiving
  '2026-12-25', // Christmas
];

const NYSE_HOLIDAYS = new Set([
  ...NYSE_HOLIDAYS_2024,
  ...NYSE_HOLIDAYS_2025,
  ...NYSE_HOLIDAYS_2026,
]);

// ─── Market Day Detection ─────────────────────────────────────────────────────

/**
 * Returns true if the given Date is a market day (Mon–Fri, not a holiday).
 * @param {Date} date
 * @returns {boolean}
 */
function isMarketDay(date) {
  const day = date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  if (day === 0 || day === 6) return false; // weekend

  // Format as YYYY-MM-DD in ET using Intl
  const etDateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

  return !NYSE_HOLIDAYS.has(etDateStr);
}

/**
 * Returns the current ET date string in YYYY-MM-DD format.
 */
function getTodayET() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

// ─── Send Notifications ───────────────────────────────────────────────────────

async function sendDailyRitualNotifications() {
  if (!vapidConfigured) {
    console.warn('[NotificationScheduler] VAPID not configured — skipping send');
    return;
  }

  const now = new Date();
  if (!isMarketDay(now)) {
    console.log(`[NotificationScheduler] ${getTodayET()} is not a market day — skipping`);
    return;
  }

  console.log(`[NotificationScheduler] Sending post-market ritual reminders for ${getTodayET()}`);

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  );

  // Fetch all active subscriptions
  const { data: subs, error } = await supabase
    .from('push_subscriptions')
    .select('id, user_id, endpoint, p256dh, auth')
    .eq('active', true);

  if (error) {
    console.error('[NotificationScheduler] Supabase fetch error:', error.message);
    return;
  }

  if (!subs || subs.length === 0) {
    console.log('[NotificationScheduler] No active subscriptions');
    return;
  }

  console.log(`[NotificationScheduler] Sending to ${subs.length} subscription(s)`);

  const payload = JSON.stringify({
    title: 'TradVue — Daily Ritual 📊',
    body: "Market's closed — ready to log today's trades?",
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    url: '/ritual',
    tag: 'post-trade-ritual',
    data: { date: getTodayET() },
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

  let sent = 0;
  let failed = 0;
  const expiredEndpoints = [];

  subs.forEach((sub, i) => {
    const result = results[i];
    if (result.status === 'fulfilled') {
      sent++;
    } else {
      failed++;
      const statusCode = result.reason?.statusCode;
      console.warn(`[NotificationScheduler] Failed for user ${sub.user_id}: ${result.reason?.message}`);
      // 404/410 = subscription expired/revoked — deactivate it
      if (statusCode === 404 || statusCode === 410) {
        expiredEndpoints.push(sub.endpoint);
      }
    }
  });

  // Deactivate expired subscriptions
  if (expiredEndpoints.length > 0) {
    await supabase
      .from('push_subscriptions')
      .update({ active: false, updated_at: new Date().toISOString() })
      .in('endpoint', expiredEndpoints);
    console.log(`[NotificationScheduler] Deactivated ${expiredEndpoints.length} expired subscription(s)`);
  }

  console.log(`[NotificationScheduler] Done — sent: ${sent}, failed: ${failed}`);
}

// ─── Cron Schedule ────────────────────────────────────────────────────────────
// "5 16 * * 1-5" = 4:05 PM, Mon–Fri
// node-cron uses server local time; we set TZ=America/New_York in the process env.

let scheduledTask = null;

/**
 * Start the notification scheduler.
 * Safe to call multiple times — will not create duplicate tasks.
 */
function startScheduler() {
  if (scheduledTask) {
    console.log('[NotificationScheduler] Already running');
    return;
  }

  initVapid();

  if (!vapidConfigured) return;

  // Verify node-cron supports timezone option (v3+)
  const cronOptions = {
    scheduled: true,
    timezone: 'America/New_York',
  };

  // 4:05 PM ET, weekdays
  scheduledTask = cron.schedule('5 16 * * 1-5', async () => {
    try {
      await sendDailyRitualNotifications();
    } catch (err) {
      console.error('[NotificationScheduler] Unhandled error:', err.message);
    }
  }, cronOptions);

  console.log('[NotificationScheduler] Scheduled — fires at 4:05 PM ET on market days');
}

/**
 * Stop the scheduler (e.g., for testing or graceful shutdown).
 */
function stopScheduler() {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    console.log('[NotificationScheduler] Stopped');
  }
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  startScheduler,
  stopScheduler,
  isMarketDay,
  sendDailyRitualNotifications,
  NYSE_HOLIDAYS,
  getTodayET,
};
