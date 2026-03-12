# Auth + Cloud Sync + Data Routes Audit
**Date:** 2026-03-12  
**Auditor:** Zip (QA Agent)  
**Project:** TradVue / tradingplatform  
**Status:** COMPLETE — Multiple critical issues found

---

## Executive Summary

The cloud sync system is **unreliable in its current state**. The single most critical bug is that the portfolio page's auth token helper reads **wrong localStorage keys**, making the dedicated DB backend completely unreachable for logged-in users. Every portfolio CRUD operation silently falls back to localStorage-only mode. Several secondary race conditions and logic errors compound this. The auth middleware itself is solid — the breakage is in the client code.

---

## Issues Found

---

### 🔴 ISSUE-01 — CRITICAL
**File:** `frontend/app/portfolio/page.tsx` line 276  
**Title:** `getAuthToken()` reads wrong localStorage keys — entire portfolio API pathway is dead

**Detail:**
```ts
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token') || localStorage.getItem('auth_token') || null
}
```
The auth system stores the token under **`cg_token`** (set in `AuthContext.tsx` line 112). Keys `'token'` and `'auth_token'` are never written anywhere in the codebase. This means:
- `getAuthToken()` always returns `null`
- `isLoggedIn` is always `false`
- `loadFromAPI()` (line 650) is **never called**
- All API writes (portfolio holdings, sold positions, watchlist, dividends) are **silently skipped**
- `authHeaders()` (line 279) always sends requests without a Bearer token
- The entire `portfolio_holdings`, `portfolio_sold`, `portfolio_watchlist`, `portfolio_dividend_overrides` tables are **completely unused** for any user from the portfolio page

**Effect:** All logged-in users are silently operating in "guest mode" on the portfolio page. Data survives only via localStorage + cloudSync JSONB blob.

**Fix:** Change `getAuthToken()` to read `cg_token`:
```ts
return localStorage.getItem('cg_token') || null
```

---

### 🔴 ISSUE-02 — CRITICAL
**File:** `backend/routes/watchlist.js` line 111  
**Title:** `req.user.subscription_tier` never set by auth middleware — free tier limit never enforced

**Detail:**
```js
if (req.user.subscription_tier === 'free') {
```
Auth middleware (`backend/middleware/auth.js`) sets:
```js
req.user = { id, email, role, appRole, name, emailVerified }
```
There is **no `subscription_tier` property** on `req.user`. The check always evaluates to `false`. The free-tier 10-item watchlist cap is **never enforced** for any user.

**Fix:** Either:
1. Add `subscription_tier` to auth middleware by querying the `user_profiles` table during token validation, OR
2. Query the profile inside the route handler and check tier explicitly

---

### 🔴 ISSUE-03 — CRITICAL
**File:** `frontend/app/portfolio/page.tsx` lines 884–895  
**Title:** Cloud sync overwrites API-loaded holdings (dual data path conflict)

**Detail:**
When `ISSUE-01` is fixed and `loadFromAPI()` runs, a second conflict emerges. Two effects race:
1. Effect at line 643: calls `loadFromAPI()` → sets `holdings` from `/api/portfolio/holdings` (normalized DB)
2. Effect at line 884: calls `initPortfolioSync(cloudToken)` → merges from `/api/user/data/portfolio` (JSONB blob) then calls `setHoldings(loadLS('cg_portfolio_holdings', []))` (line 888)

Both async effects fire on mount. Whichever resolves **last** wins. If the cloud sync effect finishes after `loadFromAPI()`, it overwrites DB-loaded holdings with the localStorage merged copy, discarding the authoritative DB data.

Additionally, the effect at line 893–895:
```ts
if (dataLoaded && holdings.length >= 0) debouncedSyncPortfolio(holdings)
```
fires on EVERY holdings change, including the intermediate state where `holdings = []` before either path completes. Since `holdings.length >= 0` is **always true**, this can push empty holdings to the cloud.

**Fix:**
- Choose ONE authoritative data source for logged-in users. Recommended: use the dedicated portfolio API (`/api/portfolio/holdings`) as truth, and disable the cloudSync portfolio path for logged-in users.
- Change the debounce guard to `holdings.length > 0` (line 894) to prevent pushing empty data.

---

### 🟡 ISSUE-04 — WARNING
**File:** `backend/services/authService.js` lines 85, 139  
**Title:** `setSession` on Supabase client is unsafe in concurrent Node.js environment

**Detail:**
```js
// signOut (line 85):
const { error: setErr } = await supabase.auth.setSession({
  access_token: accessToken,
  refresh_token: '',
});

// updatePassword (line 139):
await supabase.auth.setSession({
  access_token: accessToken,
  refresh_token: '',
});
```
If `getClient()` returns a shared/singleton Supabase client, `setSession` mutates global client state. In a concurrent Node.js server (multiple simultaneous requests), one request's `setSession` can bleed into another request's execution window, causing wrong-user operations. This is a known Supabase server-side pitfall.

**Fix:** Use Supabase's `createClient` with the user's access token inline, or use the service role client + direct SQL instead of `setSession`. For sign-out, consider calling the Supabase Admin API to invalidate the session directly.

---

### 🟡 ISSUE-05 — WARNING
**File:** `frontend/app/utils/cloudSync.ts` lines 291–303  
**Title:** `initFullSync` parallel execution causes inconsistent sync status

**Detail:**
```ts
await Promise.all([
  initJournalSync(token),   // calls setStatus('syncing'), then setStatus('synced'/'error')
  initSettingsSync(token),  // no status updates
  initPortfolioSync(token), // no status updates
  initWatchlistSync(token), // no status updates
])
```
`initJournalSync` internally calls `setStatus('syncing')` at start and `setStatus('synced'/'error')` at end. The other three syncs don't update status. If journal sync fails, the status is set to `'error'` even if portfolio and watchlist succeeded. If journal sync succeeds but runs first, status shows `'synced'` while portfolio sync is still in flight. The final status reflects only journal sync completion, ignoring the other three.

**Fix:** Coordinate status across all four sync functions — track completion count and only set final status when all four have resolved.

---

### 🟡 ISSUE-06 — WARNING
**File:** `frontend/app/page.tsx` lines 3040, 3076  
**Title:** Watchlist drag-to-reorder writes to `cg_watchlist` but all other reads use `cg_wl`

**Detail:**
The main watchlist state machine reads/writes `cg_wl` (lines 2121, 2132, 2142). CloudSync's `WATCHLIST_KEY = 'cg_wl'` also uses this key. However, the drag-and-drop reorder handler writes to `cg_watchlist` (a different key):
```ts
// line 3040, 3076
try { localStorage.setItem('cg_watchlist', JSON.stringify(next)) } catch {}
```
This means after a drag-reorder, the updated order is persisted to `cg_watchlist` which is never read back. On next app load, the watchlist reverts to its pre-reorder order from `cg_wl`.

**Fix:** Change both drag/drop save calls (lines 3040, 3076 in page.tsx) to use `'cg_wl'` instead of `'cg_watchlist'`.

---

### 🟡 ISSUE-07 — WARNING
**File:** `frontend/app/portfolio/page.tsx` lines 876–879  
**Title:** Portfolio sub-data (sold, watchlist, dividends) not included in cloud sync — data loss on new device

**Detail:**
`debouncedSyncPortfolio(holdings)` (line 894) only syncs the `holdings` array to `user_data.portfolio` in the cloud. The following are stored only in localStorage and never cloud-synced:
- `cg_portfolio_sold` — sold positions
- `cg_portfolio_watchlist` — portfolio watchlist
- `cg_portfolio_dividends` — dividend overrides
- `cg_portfolio_settings` — portfolio settings
- `cg_portfolio_snapshots` — historical snapshots

If a user logs in on a new browser/device, only holdings are restored from cloud. All sold history, watchlist, dividends, and settings are lost.

**Fix:** Either:
1. Bundle all portfolio sub-data into the cloudSync portfolio blob, OR
2. Fix ISSUE-01 so the dedicated DB API is used (it already persists all these types)

---

### 🟡 ISSUE-08 — WARNING
**File:** `frontend/app/utils/cloudSync.ts` lines 73–82  
**Title:** `cloudGet` double-unwrap logic is fragile — could corrupt data with certain payloads

**Detail:**
```ts
let payload = json.data ?? json[type] ?? json
if (payload && typeof payload === 'object' && !Array.isArray(payload) && 'data' in payload) {
  payload = payload.data
}
```
This unwraps one level of `{ data: ... }` nesting. This works because `cloudPut` wraps data as `{ data: <actual> }` and the backend stores the full request body, resulting in `{ data: { data: <actual> } }` in the DB (for objects) or `{ data: [...] }` (for arrays).

However, if the actual payload is a settings/journal object that legitimately contains a top-level `data` key (e.g., a future schema change), the inner value would be stripped incorrectly and the wrong data would be returned. This is silent data corruption.

**Fix:** Store data without the extra wrapper. Change `cloudPut` body to `JSON.stringify(data)` directly, and update the backend handler to accept the raw payload. Remove the double-unwrap in `cloudGet`.

---

### 🔵 ISSUE-09 — INFO
**File:** `frontend/app/portfolio/page.tsx` line 894  
**Title:** Debounce guard `holdings.length >= 0` is a no-op — always true

**Detail:**
```ts
if (dataLoaded && holdings.length >= 0) debouncedSyncPortfolio(holdings)
```
`Array.length` is always `>= 0`. The intended guard is `holdings.length > 0` to prevent pushing empty arrays to the cloud. As written, this will always fire, including on initial render when holdings is empty.

**Fix:** Change to `holdings.length > 0`.

---

### 🔵 ISSUE-10 — INFO
**File:** `backend/services/authService.js` lines 85–94  
**Title:** `signOut` passes empty `refresh_token` to `setSession`

**Detail:**
```js
const { error: setErr } = await supabase.auth.setSession({
  access_token: accessToken,
  refresh_token: '',  // ← empty string
});
```
Passing an empty string as `refresh_token` may not behave reliably across all Supabase SDK versions. Some versions require a valid (or at least non-empty) refresh token when calling `setSession`.

**Fix:** Use the Supabase Admin API to invalidate sessions by user ID instead of relying on `setSession` + `signOut`.

---

### 🔵 ISSUE-11 — INFO
**File:** `frontend/app/utils/cloudSync.ts` line 265  
**Title:** `debouncedSyncPortfolio` lacks a guard against empty array pushes

**Detail:**
```ts
export function debouncedSyncPortfolio(holdings: unknown[]): void {
  const token = getToken()
  if (!token) return
  // No check: if holdings = [], we still queue a cloud push
  ...
  _portfolioTimer = setTimeout(async () => {
    await cloudPut(token, 'portfolio', holdings)
  }, 5000)
}
```
If called with an empty array (e.g., during app init before data loads), it will schedule a push of `[]` to the cloud, potentially overwriting valid stored data. The 5-second debounce and subsequent calls with real data often prevent this, but it's a latent risk.

**Fix:** Add `if (!holdings.length) return` guard at the start of the function.

---

### 🔵 ISSUE-12 — INFO
**File:** `frontend/app/utils/cloudSync.ts` line 113  
**Title:** `initJournalSync` merge uses entry count as "more complete" heuristic — can lose data

**Detail:**
```ts
function mergeArrays<T>(local: T[], cloud: T[]): T[] {
  // Both have data — use whichever has more entries
  return cloud.length > local.length ? cloud : local
}
```
If local has 10 entries and cloud has 11, cloud wins even if local has newer, unsaved entries that aren't in cloud. This silently drops local data. For a trading journal, losing a trade log entry is significant.

**Fix:** Do a proper ID-based merge rather than count-based selection, or use a timestamp comparison.

---

## Database Status

**API Health:** ✅ `https://tradvue-api.onrender.com/health` returns `{"status":"OK"}`

**Tables present in `public` schema:**
```
alert_notifications, calendar_events, dashboard_activity, dashboard_agents,
dashboard_companies, dashboard_notifications, dashboard_projects, dashboard_settings,
dashboard_tasks, instruments, journal_trade_tags, news_articles,
portfolio_dividend_overrides, portfolio_holdings, portfolio_settings,
portfolio_sold, portfolio_transactions, portfolio_watchlist, price_alerts,
price_data, refresh_tokens, trade_tag_categories, trade_tags,
user_data, user_profiles, users, waitlist, watchlists
```
All expected tables exist. The `user_data` table (used by cloud sync) is present. The dedicated portfolio tables (`portfolio_holdings`, `portfolio_sold`, etc.) exist but are unreachable from the portfolio page due to ISSUE-01.

---

## Auth Middleware Audit

**Middleware sets:** `req.user = { id, email, role, appRole, name, emailVerified }`

**All route files checked:**

| Route File | Properties Used | Status |
|---|---|---|
| `routes/auth.js` | `req.user.id`, `req.user.name` | ✅ Match |
| `routes/portfolio.js` | `req.user.id` | ✅ Match |
| `routes/dashboard.js` | `req.user.id` | ✅ Match |
| `routes/userData.js` | `req.user.id` | ✅ Match |
| `routes/alerts.js` | `req.user.id` | ✅ Match |
| `routes/priceAlerts.js` | `req.user.id` | ✅ Match |
| `routes/watchlist.js` | `req.user.id`, `req.user.subscription_tier` | ❌ `subscription_tier` NOT SET (ISSUE-02) |

No routes use `req.user.userId` (wrong pattern). All routes except watchlist.js use only valid middleware-set properties.

---

## Cloud Sync System Assessment

**Is the sync system reliable?** ❌ **No, for these reasons:**

1. For logged-in users on the portfolio page, the entire dedicated DB backend is bypassed (ISSUE-01). All portfolio data lives only in localStorage + JSONB blob.
2. Only the `holdings` array is synced to the cloud from the portfolio page. Sold positions, portfolio watchlist, dividends, settings, and snapshots are localStorage-only.
3. The merge strategy (higher count wins) can silently drop locally-created entries.
4. Drag-to-reorder writes to a key that's never read back, making reorder state ephemeral.
5. If `cg_portfolio_holdings` in localStorage is empty when `debouncedSyncPortfolio` fires, it can clobber valid cloud data.

**What does work reliably:**
- Journal sync (`cg_journal_trades`, `cg_journal_notes`) — keys match journal/page.tsx, logic is correct
- Settings sync — correct, no conflicts
- Auth middleware — correct for all routes except watchlist subscription_tier
- API health and DB schema — healthy and complete
- `cloudGet`/`cloudPut` format — the double-unwrap works correctly for current data shapes

---

## Priority Fix Order

1. **ISSUE-01** — Fix `getAuthToken()` token key (`cg_token`). Single line change, unlocks entire portfolio API pathway.
2. **ISSUE-02** — Fix `req.user.subscription_tier` in watchlist.js. Add a user profile query or populate it in middleware.
3. **ISSUE-03** — After fixing ISSUE-01, eliminate the dual data path conflict. Pick one authoritative source.
4. **ISSUE-09 + ISSUE-11** — Fix the `>= 0` guard to `> 0` and add it to `debouncedSyncPortfolio`.
5. **ISSUE-06** — Fix `cg_watchlist` → `cg_wl` in drag/drop handlers.
6. **ISSUE-04** — Audit `setSession` in authService.js for concurrency safety.
7. **ISSUE-07** — Extend cloud sync to cover sold positions, dividends, settings.
8. **ISSUE-12** — Improve merge strategy to be ID-based rather than count-based.
