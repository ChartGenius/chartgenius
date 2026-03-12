# TradVue Task Queue — 2026-03-12
_Master list of everything discussed. Bolt builds, Zip verifies, Axle orchestrates._

## ✅ BATCH 1: QA Fixes + Core Automation (COMPLETE)
- [x] Fix `/login` 404 (portfolio links)
- [x] Fix 5 dead landing page links (/about, /contact, /team, /roadmap, /blog)
- [x] Fix `/learn` dead link on help page
- [x] Fix calendar showing yesterday's events
- [x] Replace ~35 remaining emojis with SVG icons
- [x] Add meta tags for /status and /changelog
- [x] Disclose mock data on heatmap/sectors
- [x] One-click trade logging from watchlist
- [x] Smart defaults per asset class (journal)
- [x] Auto-fill entry price from market data (journal)
- [x] Calendar auto-highlights for watchlist stocks
- [x] Weekly performance auto-summary (journal)

## ✅ BATCH 2: New Tools — Tools Page (COMPLETE)
- [x] Options Profit Calculator (P&L chart, break-even, Greeks)
- [x] Compound Growth Calculator (area chart, year-by-year table)
- [x] Risk of Ruin Calculator (Monte Carlo simulation, Kelly Criterion)
- [x] Forex Pip Calculator (20+ pairs, pip values, leverage/margin)
- [x] Universal Position Sizer (all asset classes, risk % scenarios)
- [x] Trade Expectancy Calculator (system profitability check)
- [x] Correlation Matrix (2-8 tickers, color-coded grid)
- [x] Market Session World Clock (all global sessions, overlap periods)
- [x] Economic Calendar Heatmap (weekly grid, impact color-coded)
- [x] Dividend Income Planner (standalone reference calc)
- [x] Organize tools into categories: Trading Calculators, Risk & Analytics, Planning, Market Overview

## 🔨 BATCH 3: Page Integrations (IN PROGRESS)

### Portfolio Page
- [x] DRIP Simulator (toggle per holding, projected growth with reinvestment)
- [ ] Portfolio Risk Score (auto-calculated 1-100, concentration/sector/beta) — **BOLT BUILDING**
- [ ] Dividend Calendar (ex-div dates, monthly income projections) — **BOLT BUILDING**

### Journal Page
- [ ] Pattern Detection ("you lose 70% on Mondays", "morning trades best")
- [ ] Win/Loss Streak Tracker (current streak, best/worst historical)
- [ ] Emotional Tags (Confident/FOMO/Revenge/Disciplined → performance correlation)

### Dashboard Page
- [x] Smart Alerts Bar (earnings warnings, win rate drops, high-impact events)
- [x] Market Alert Engine (real-time unusual move detection + catalyst linking)
- [x] Upcoming Events Widget (countdown timers to high-impact events)
- [ ] Daily P&L Ticker in header ("Today: +$450, 3W/1L")

## 🧪 BATCH 4: Verification (ZIP RUNNING NOW)
- [ ] Independent math verification of ALL calculators — **ZIP RUNNING**
- [ ] Hand-calculated test cases per tool
- [ ] Edge case testing (zeros, negatives, large numbers)
- [ ] Every formula must match within 0.01% tolerance
- [ ] Full report with pass/fail per tool

## ✅ BATCH 5: Infrastructure (MOSTLY COMPLETE)
- [x] Auth frontend UI (login/signup modal, sync indicator)
- [x] Run Supabase migration 010 (user_data tables)
- [x] Set Supabase env vars on Render
- [x] Shut down Railway — Erick deleting from dashboard
- [x] Remove Railway URL from CORS + CSP
- [x] Google Analytics — G-S86BS36L9X renamed to TradVue
- [x] Legal pages (Terms, Privacy, Disclaimer, Cookies)
- [x] Disclaimers on all tools + journal + portfolio + footer
- [x] Landing page refresh + SEO (meta tags, JSON-LD, feature showcase)
- [x] Market alerts engine + breaking news fast-refresh
- [x] Daily ideation cron (2 PM ET)
- [ ] chartgenius.io redirect (week of 3/16)
- [ ] chartgenius.io removal from Vercel (week of 3/23)
- [ ] Find first 10 users (Reddit, Twitter, Discord) — **DRAFTS READY**
- [ ] AI support chatbot on /help page

## 🚀 FUTURE SPRINT: Advanced Automation
- [ ] Broker API integration (Robinhood, IBKR, Webull, TD Ameritrade)
- [ ] Auto-populate trade data from symbol + timestamp (historical prices)
- [ ] AI trade tagging ("Looks like a breakout trade during market open")
- [ ] Post-trade replay ("You exited at $155. Stock went to $172 in 5 days")
- [ ] Auto-generated weekly email reports
- [ ] Push notifications for price alerts
- [ ] Portfolio rebalancing suggestions

## Rules
- Axle orchestrates, never implements
- Bolt builds features, Zip verifies math
- No tool goes live without independent verification
- No duplicates — merge if functionality overlaps
- Every calculator must have tooltips, instructions, mobile support
- Features go WHERE THEY BELONG (portfolio/journal/dashboard), not all on tools page
- ALWAYS run full regression test after ANY fix
