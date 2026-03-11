# TradVue Task Board
_Last updated: 2026-03-11 10:45 AM ET_

---

## 🔴 P0 — DO NOW (blocking or broken)

- [ ] **Switch backend from Railway to Render** — Railway CLI is unreliable, deploys flaky. Migration plan ready at `docs/RENDER_MIGRATION_PLAN.md`. ~30 min effort.
- [ ] **Calendar dates/times wrong** — Fix deployed but waiting on Railway cache to expire. Verify after Render migration.
- [ ] **Calendar needs more events** — Finnhub economic endpoint returning 403 (API limit or key issue). Need secondary data source.
- [ ] **Page consistency not complete** — Cards use shared `.tv-card` classes now, but some pages still don't match Tools page visually. Need screenshot review.

## 🟡 P1 — THIS WEEK

- [ ] **Google Analytics setup** — No GA tag installed. Need to create GA4 property for tradvue.com and add the tracking snippet. Our custom `analytics.ts` exists but doesn't send to GA.
- [ ] **User authentication (Supabase Auth)** — Required for saving journal/portfolio across devices. Design: email + Google sign-in, TradVue-branded, seamless.
- [ ] **Pricing page + free/pro tier gating** — Business plan defines the tiers. Need UI for pricing page and logic to gate pro features.
- [ ] **Ad placement infrastructure** — Free tier gets tasteful ads, pro is ad-free. Erick wants to review layout first.
- [ ] **Domain redirect** — chartgenius.io → tradvue.com (week of 3/16)
- [ ] **GitHub flag resolution** — Appeal submitted, waiting on response.
- [ ] **GitHub account email change** — chartgeniusadmin@gmail.com → dev@apexlogics.com (need to set up apexlogics.com email first)
- [ ] **Vercel auto-deploy** — Broken since team rename. Using CLI deploys as workaround. Fix when GitHub flag is cleared.
- [ ] **Update business plan** — Add Render migration, remove Railway references

## 🟢 P2 — NEXT WEEK

- [ ] **Render migration cleanup** — Remove Railway service after 48h stable on Render. Update all docs, backup scripts, cron jobs.
- [ ] **chartgenius.io removal** — Remove from Vercel (week of 3/23)
- [ ] **Support email setup complete** — support@tradvue.com routing done ✅. Still need: AI chatbot on /help page, Zip monitoring inbox.
- [ ] **SEO implementation** — Strategy doc exists. Need: meta tags, sitemap, robots.txt, structured data.
- [ ] **Broker auto-import research** — Biggest competitive gap vs TradeZella. Research APIs for Robinhood, IBKR, WeBull.

## 🔵 P3 — BACKLOG

- [ ] **ops.apexlogics.com** — Internal dashboard behind Tailscale
- [ ] **Real-time agent status** — OpenClaw → dashboard integration
- [ ] **WebSocket for live data** — Replace polling with streaming
- [ ] **Redis on Render** — Add when we hit 1K+ users for shared cache
- [ ] **Multi-region deployment** — When user base justifies it
- [ ] **Time Machine backup** — Waiting for external drive

---

## ✅ RECENTLY COMPLETED

- [x] Rate limit fix (100→1000) — deployed
- [x] DB startup delay — deployed
- [x] Frontend error handling + retry logic — deployed
- [x] TradVue branding fix across all docs/code — deployed
- [x] Major layout overhaul (nav, sidebar, watchlist, news page) — deployed
- [x] Portfolio privacy toggle (eye icon) — deployed
- [x] News filtering (category + quantity) — deployed
- [x] Shared quote cache + prefetcher (55 tickers, 30s refresh) — deployed
- [x] Timezone support (auto-detect + manual override) — deployed
- [x] TV-Card shared CSS system — deployed
- [x] Business plan PDF — delivered
- [x] Memory watchdog script — running every 15 min
- [x] Backup system — local + Google Drive, nightly
- [x] Deploy script created (scripts/deploy.sh)
- [x] Render migration plan drafted
- [x] Full Disk Access for Node/OpenClaw — granted
- [x] Discord docs locked
- [x] Vercel team renamed
- [x] support/legal/privacy @tradvue.com emails set up
- [x] Gmail filters configured

---

## 📋 ERICK ACTION ITEMS

- [ ] Set up `dev@apexlogics.com` email in Cloudflare (same process as TradVue emails)
- [ ] Create Render account at render.com (needed for migration)
- [ ] Review UI changes on tradvue.com and list what needs tweaking
- [ ] Wait for GitHub flag response from Sophia
- [ ] Review business plan PDF and flag any changes needed

---

## ⚠️ KNOWN ISSUES

| Issue | Status | Workaround |
|-------|--------|------------|
| Railway deploys flaky | Migrating to Render | GitHub auto-deploy works, CLI doesn't |
| Calendar shows wrong dates | Fix deployed, cache clearing | Wait 30 min or restart service |
| Finnhub economic calendar 403 | API limit hit | ForexFactory is primary source |
| Vercel auto-deploy broken | GitHub flag | CLI deploy works fine |
| Some pages don't match Tools styling | In progress | Iterating with Bolt |
