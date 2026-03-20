# "Alarm Clock That Never Goes Off" — Platform Audit
**Date:** March 19, 2026

## Summary

| # | Feature | Status | Verdict |
|---|---------|--------|---------|
| 1 | Price Alerts — Monitoring | ⚠️ | Cron runs, marks triggered in DB, but ZERO notification sent |
| 2 | Price Alerts — UI Context | ❌ | Dashboard shows no current price, no % distance to target |
| 3 | Push Notifications — Service Worker | ✅ | Fully wired |
| 4 | Push Notifications — Ritual Reminder | ✅ | 4:05 PM ET weekdays, works |
| 5 | Push Notifications — Price Alert Trigger | ❌ | Never fires a push when alert triggers |
| 6 | Trading Rules / AI Rule Cop | ⚠️ | Only runs on manual button click, not automatic |
| 7 | Post-Trade Ritual | ✅ | Works |
| 8 | AI Coach | ✅ | Honest statistical engine, no fake AI |
| 9 | Market Alerts / SSE | ✅ | Real RSS polling + SSE broadcast |
| 10 | Email Notifications | ❌ | Toggle exists, nothing ever sends |
| 11 | Prop Firm Tracker | ⚠️ | Works if trades linked, no indicator of manual vs calculated |
| 12 | Watchlist Prices | ✅ | Live Finnhub quotes |
| 13 | Watchlist Alert Thresholds | ❌ | DB fields exist, nothing monitors them |

## Critical Fixes Needed

### P0 — Alarm clocks that never go off
1. Price alert triggers → send push notification + dashboard visual
2. Email notification toggle → actually send emails (or remove the toggle)
3. Watchlist alert thresholds → either wire up monitoring or remove the fields

### P1 — Missing context
4. Price alerts UI → show current price, % away from target, everywhere
5. Rule Cop → auto-run on page load + when new trade saved
6. Prop Firm → label manual vs auto-calculated gauges

### P2 — Dead code
7. `max_daily_profit` rule type → no-op, remove from dropdown or implement
8. `custom` rule type → always skipped
