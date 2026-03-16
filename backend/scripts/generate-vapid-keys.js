#!/usr/bin/env node
/**
 * Generate VAPID Keys for Web Push Notifications
 *
 * Run once:  node scripts/generate-vapid-keys.js
 *
 * Then copy the output into your .env file.
 * The VAPID_PRIVATE_KEY must NEVER be committed to version control.
 *
 * Required env vars afterwards:
 *   VAPID_PUBLIC_KEY   — sent to the browser (safe to expose)
 *   VAPID_PRIVATE_KEY  — stays on the server only
 *   VAPID_SUBJECT      — mailto: or URL identifying you (required by web-push spec)
 */

'use strict';

const webPush = require('web-push');

const vapidKeys = webPush.generateVAPIDKeys();

console.log('\n✅  VAPID Keys Generated\n');
console.log('Copy the following into your backend/.env file:\n');
console.log('──────────────────────────────────────────────────────────────');
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log('VAPID_SUBJECT=mailto:support@tradvue.com');
console.log('──────────────────────────────────────────────────────────────');
console.log('\n⚠️  Keep VAPID_PRIVATE_KEY secret — it never leaves the server.');
console.log('ℹ️  VAPID_PUBLIC_KEY goes in your frontend .env.local as NEXT_PUBLIC_VAPID_PUBLIC_KEY\n');

module.exports = { publicKey: vapidKeys.publicKey, privateKey: vapidKeys.privateKey };
