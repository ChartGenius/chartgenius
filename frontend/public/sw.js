/**
 * TradVue Service Worker — Push Notification Handler
 *
 * Handles:
 *  - push events  → shows notification
 *  - notificationclick → opens /ritual page
 *
 * Scope: / (full site scope, placed in /public root)
 */

const RITUAL_URL = '/ritual';
const DEFAULT_ICON = '/icons/icon-192x192.png';
const DEFAULT_BADGE = '/icons/icon-192x192.png';

// ─── Install & Activate ───────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  // Skip waiting so the new SW takes over immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Claim all open clients so they're controlled immediately
  event.waitUntil(self.clients.claim());
});

// ─── Push Event ───────────────────────────────────────────────────────────────

self.addEventListener('push', (event) => {
  let data = {
    title: 'TradVue',
    body: "📊 Market's closed — ready to log today's trades?",
    icon: DEFAULT_ICON,
    badge: DEFAULT_BADGE,
    url: RITUAL_URL,
    tag: 'post-trade-ritual',
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = {
        title: payload.title || data.title,
        body: payload.body || data.body,
        icon: payload.icon || data.icon,
        badge: payload.badge || data.badge,
        url: payload.url || data.url,
        tag: payload.tag || data.tag,
        data: payload.data || {},
      };
    } catch {
      // If not JSON, use the raw text as body
      data.body = event.data.text() || data.body;
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    renotify: true,
    requireInteraction: false,
    data: {
      url: data.url,
      ...(data.data || {}),
    },
    actions: [
      {
        action: 'open-ritual',
        title: '📝 Log Trades',
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// ─── Notification Click ───────────────────────────────────────────────────────

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // 'dismiss' action just closes
  if (event.action === 'dismiss') return;

  const targetUrl = (event.notification.data && event.notification.data.url)
    ? event.notification.data.url
    : RITUAL_URL;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus an existing window on the target URL if one exists
      for (const client of clientList) {
        const clientUrl = new URL(client.url);
        const target = new URL(targetUrl, self.location.origin);
        if (clientUrl.pathname === target.pathname && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// ─── Push Subscription Change ─────────────────────────────────────────────────
// Re-subscribe automatically if the browser rotates keys

self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: event.oldSubscription
        ? event.oldSubscription.options.applicationServerKey
        : null,
    }).then((newSubscription) => {
      // Notify the backend about the new subscription
      return fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSubscription),
        credentials: 'include',
      });
    }).catch((err) => {
      console.error('[SW] pushsubscriptionchange failed:', err);
    })
  );
});
