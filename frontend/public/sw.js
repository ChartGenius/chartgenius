/**
 * TradVue Service Worker — Push Notification Handler
 *
 * Handles:
 *  - push events  → shows notification (ritual reminders + price alerts)
 *  - notificationclick → navigates to correct URL per notification type
 *  - pushsubscriptionchange → re-subscribes automatically
 *
 * Scope: / (full site scope, placed in /public root)
 */

const DEFAULT_ICON  = '/icons/icon-192x192.png';
const DEFAULT_BADGE = '/icons/icon-192x192.png';
const RITUAL_URL    = '/ritual';
const ALERTS_URL    = '/portfolio?tab=alerts';

// ─── Install & Activate ───────────────────────────────────────────────────────

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// ─── Push Event ───────────────────────────────────────────────────────────────

self.addEventListener('push', (event) => {
  // Safe defaults
  let data = {
    title:  'TradVue',
    body:   "Market's closed — ready to log today's trades?",
    icon:   DEFAULT_ICON,
    badge:  DEFAULT_BADGE,
    url:    RITUAL_URL,
    tag:    'post-trade-ritual',
    data:   {},
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = {
        title:  payload.title  || data.title,
        body:   payload.body   || data.body,
        icon:   payload.icon   || DEFAULT_ICON,
        badge:  payload.badge  || DEFAULT_BADGE,
        url:    payload.url    || data.url,
        tag:    payload.tag    || data.tag,
        data:   payload.data   || {},
      };
    } catch {
      data.body = event.data.text() || data.body;
    }
  }

  // Price alert pushes get a specific action set
  const isPriceAlert = data.tag && data.tag.startsWith('price-alert-');

  const actions = isPriceAlert
    ? [
        { action: 'view-alerts', title: '📊 View Alerts' },
        { action: 'dismiss',     title: 'Dismiss' },
      ]
    : [
        { action: 'open-ritual', title: '📝 Log Trades' },
        { action: 'dismiss',     title: 'Dismiss' },
      ];

  const options = {
    body:               data.body,
    icon:               data.icon,
    badge:              data.badge,
    tag:                data.tag,
    renotify:           true,
    requireInteraction: isPriceAlert,   // price alerts stay until dismissed
    data: {
      url: data.url,
      ...data.data,
    },
    actions,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// ─── Notification Click ───────────────────────────────────────────────────────

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  // Use the URL from notification data, falling back intelligently
  let targetUrl = RITUAL_URL;
  if (event.notification.data && event.notification.data.url) {
    targetUrl = event.notification.data.url;
  } else if (event.action === 'view-alerts') {
    targetUrl = ALERTS_URL;
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Try to focus an existing window at the target path
      const target = new URL(targetUrl, self.location.origin);
      for (const client of clientList) {
        try {
          const clientUrl = new URL(client.url);
          if (clientUrl.pathname === target.pathname && 'focus' in client) {
            return client.focus();
          }
        } catch {}
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// ─── Push Subscription Change ─────────────────────────────────────────────────

self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly:      true,
      applicationServerKey: event.oldSubscription
        ? event.oldSubscription.options.applicationServerKey
        : null,
    }).then((newSub) => {
      return fetch('/api/push/subscribe', {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify({ subscription: newSub }),
        credentials: 'include',
      });
    }).catch((err) => {
      console.error('[SW] pushsubscriptionchange failed:', err);
    })
  );
});
