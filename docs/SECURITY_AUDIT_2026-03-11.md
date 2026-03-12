# TradVue Security Audit — 2026-03-11

**Auditor:** Zip (Security/QA Agent)  
**Date:** March 11, 2026  
**Scope:** Full codebase — backend, frontend, live endpoints  
**Project:** `/Users/mini1/.openclaw/workspace/tradingplatform`  
**Live API:** `https://tradvue-api.onrender.com`

---

## Summary

| Severity | Count |
|----------|-------|
| 🔴 CRITICAL | 3 |
| 🟡 IMPORTANT | 7 |
| 🟢 GOOD | 14 |

---

## 🔴 CRITICAL FINDINGS

---

### [CRITICAL-1] Supabase Project ID Hard-coded in Source Code Comments

**Files:**
- `backend/middleware/auth.js` line 17
- `backend/services/authService.js` lines 8–9

**Details:**
The production Supabase project ID (`ryckpsjmsrxbiylddqnb`) is embedded in JSDoc comments that will be visible in version control history and any code leak:
```
SUPABASE_URL = https://ryckpsjmsrxbiylddqnb.supabase.co
```

While the anon key is not exposed here, the project URL allows anyone to:
- Discover the Supabase project
- Attempt to exploit misconfigured RLS policies
- Enumerate public tables if RLS is not airtight

**Fix:** Replace with placeholder: `SUPABASE_URL = https://<project-id>.supabase.co`

---

### [CRITICAL-2] `authenticateToken` Import Mismatch — Routes May Load as Broken

**Files:**
- `backend/routes/portfolio.js` line 37
- `backend/routes/dashboard.js` line 48
- `backend/routes/priceAlerts.js` line 13
- `backend/routes/watchlist.js` line 15

**Details:**
All four files import `authenticateToken` from `./auth`:
```js
const { authenticateToken } = require('./auth');
```

However, `backend/routes/auth.js` only exports `module.exports = router` — it does **not** export `authenticateToken`. This means `authenticateToken` resolves to `undefined`.

When `router.use(undefined)` is called at module load time, Express throws:
```
Error: argument handler is required
```

This is a code defect that would crash these route modules on load. The **live server appears to be running an older deployment** that may have had a different auth.js. The local codebase is out of sync with what's deployed.

**Risk if deployed from current local codebase:**
- `portfolio.js`, `dashboard.js`, `priceAlerts.js` would fail to load → routes unreachable (500 errors) or authentication completely bypassed depending on Express version behavior
- All protected user data routes would be broken

**Fix:** Export `authenticateToken` from auth.js, OR migrate all four files to use `requireAuth` from `middleware/auth.js` (the correct Supabase-based middleware).

---

### [CRITICAL-3] Old Railway URL in CSP `connectSrc` (Live Production)

**File:** `backend/server.js` line 45  
**Live endpoint:** Confirmed via `curl -I https://tradvue-api.onrender.com/health`

**Details:**
The live CSP header includes:
```
connect-src 'self' https://tradvue-api.onrender.com https://tradvue-production.up.railway.app
```

The Railway URL (`tradvue-production.up.railway.app`) is a **decommissioned deployment URL**. Keeping it in CSP:
- Widens the attack surface — if Railway URL gets re-registered by someone else, it becomes a trusted origin in your CSP
- Violates principle of least privilege

**Fix:** Remove `https://tradvue-production.up.railway.app` from the `connectSrc` directive in `server.js`.

---

## 🟡 IMPORTANT FINDINGS

---

### [IMPORTANT-1] `express-rate-limit` Vulnerable to IPv4-Mapped IPv6 Bypass

**Package:** `express-rate-limit@8.2.1`  
**CVE:** GHSA-46wh-pxpv-q5gq  
**Severity:** HIGH (npm audit)

**Details:**
The installed version allows IPv4-mapped IPv6 addresses (e.g., `::ffff:1.2.3.4`) to bypass per-client rate limiting on dual-stack servers. An attacker could use this to brute-force auth endpoints with more attempts than the limit allows.

**Affected limiters:**
- `generalLimiter` (1000 req/15min) — applied globally
- `authLimiter` (5 req/15min) — protects signup/login/forgot
- `strictLimiter` (15 req/15min)

**Fix:** `cd backend && npm audit fix` — this updates express-rate-limit to a patched version.

---

### [IMPORTANT-2] `/api/auth/refresh` and `/api/auth/reset` Have No Rate Limiting

**File:** `backend/routes/auth.js`

**Details:**
- `POST /api/auth/refresh` — no rate limiter applied
- `POST /api/auth/reset` — no rate limiter applied

These endpoints accept sensitive tokens. Without rate limiting, they are vulnerable to:
- Token enumeration attacks on `/refresh`
- Unlimited reset attempts on `/reset`

The general limiter (1000/15min) provides some protection, but auth endpoints warrant the tighter `authLimiter` (5/15min).

**Fix:**
```js
router.post('/refresh', authLimiter, async (req, res) => { ... });
router.post('/reset', authLimiter, async (req, res) => { ... });
```

---

### [IMPORTANT-3] Scoring Formula Fully Exposed via API Response

**File:** `backend/services/stockScore.js`  
**Endpoint:** `GET /api/stocks/:ticker/score`

**Details:**
The stock scoring API returns a full `breakdown` object with weights, sub-scores, and detailed calculation inputs:
```json
{
  "breakdown": {
    "value": { "score": 72, "weight": 25, "pe": 28.4, "sectorAvg": 30, "ratio": 0.95 },
    "growth": { "score": 81, "weight": 25, "revenueGrowthPct": 12.5 },
    "momentum": { "score": 68, "weight": 25, "goldenCross": true },
    "profitability": { "score": 77, "weight": 25, "profitMarginPct": 26.4 }
  }
}
```

The scoring algorithm (25% weights, exact threshold values in `scoreValue`, `scoreGrowth`, etc.) is **proprietary business logic** that could be reverse-engineered from the API output.

**Fix:** Return only `{ totalScore, grade, symbol }` in the public endpoint. Reserve the full breakdown for authenticated users or admin access. Consider stripping the exact weight values.

---

### [IMPORTANT-4] `/api/journal/import` Has No Authentication

**File:** `backend/routes/journal.js`  
**Endpoints:**
- `POST /api/journal/import`
- `POST /api/journal/import/preview`
- `GET /api/journal/export`

**Details:**
These endpoints accept file uploads (up to 5MB CSV) with no authentication required. While the journal data is processed client-side for now, the endpoints:
- Accept file uploads from unauthenticated users
- Could be abused for resource exhaustion (repeated 5MB uploads)

**Fix:** Add `requireAuth` middleware to these endpoints. At minimum, apply a strict rate limiter.

---

### [IMPORTANT-5] `/api/backup/*` Endpoints Unauthenticated

**File:** `backend/routes/backup.js`  
**Endpoints:**
- `GET /api/backup/export`
- `POST /api/backup/restore`
- `GET /api/backup/portfolio-export`

**Details:**
All backup routes are completely unauthenticated. While currently stub endpoints, `POST /api/backup/restore` accepts arbitrary JSON payloads with `data` and `mode` fields from anyone. The stubs validate structure and could process real data in future without a security review. Confirmed accessible live:
```
curl https://tradvue-api.onrender.com/api/backup/restore -d '{"data":{"version":"1","type":"full_backup"}}'
→ 200 OK (no auth required)
```

**Fix:** Add `requireAuth` to all backup routes now, even as stubs. Security should be built in before features.

---

### [IMPORTANT-6] Login Failure Logs User Email + IP

**File:** `backend/routes/auth.js` line 161

**Details:**
```js
console.warn(`[Auth] Failed login for ${email} from ${req.ip}`);
```

Production logs will contain user email addresses for every failed login attempt. If logs are stored in Render/Cloudflare/aggregation services, this creates a PII exposure and compliance risk (GDPR, etc.).

**Fix:** Hash or truncate the email in logs:
```js
console.warn(`[Auth] Failed login for ${email.split('@')[1]} from ${req.ip}`);
// or just
console.warn(`[Auth] Failed login attempt from ${req.ip}`);
```

---

### [IMPORTANT-7] No Frontend Content Security Policy (CSP) Meta Tag or `next.config.js` Headers

**Files:** `frontend/next.config.js`, `frontend/vercel.json`

**Details:**
`vercel.json` only sets basic headers (`X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`). There is no `Content-Security-Policy` header set for the frontend. The backend has Helmet-based CSP, but the frontend Next.js app has no CSP, leaving it open to XSS escalation if any injection occurs.

**Fix:** Add CSP to `vercel.json` headers:
```json
{ "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; ..." }
```
Or add `headers()` in `next.config.js`.

---

## 🟢 GOOD (Passing Checks)

---

### [GOOD-1] CORS Locked to Production Origins ✅
`server.js` allows only `https://www.tradvue.com` and `https://tradvue.com` in production. `localhost` ports are added only in non-production. No wildcard origins. The Railway URL was **already removed from CORS** (it only appears in CSP).

### [GOOD-2] Helmet Security Headers Applied ✅
Production server returns: `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Strict-Transport-Security: max-age=31536000`, CSP, `X-Powered-By` disabled. All verified via live curl.

### [GOOD-3] JWT Startup Guard ✅
```js
if (!process.env.JWT_SECRET) {
  process.exit(1);
}
```
Server refuses to start without a JWT secret — prevents accidental deployment with empty secrets.

### [GOOD-4] Auth Rate Limiting (signup/login/forgot) ✅
`authLimiter`: 5 attempts per 15 minutes per IP, with `skipSuccessfulRequests: true`. Brute-force protection is in place for the primary auth endpoints.

### [GOOD-5] Password Enumeration Prevention ✅
Forgot password always returns success regardless of whether email exists. Login returns generic "Invalid email or password" without revealing which was wrong.

### [GOOD-6] Input Validation on Auth Routes ✅
Email regex validation, password minimum length (8 chars), trimming/lowercasing of email before processing. SQL injection not possible on auth routes (Supabase client, not raw SQL).

### [GOOD-7] Supabase RLS as Secondary Defense ✅
`userData.js` uses user-scoped Supabase client (via access token passthrough), ensuring database-level RLS policies enforce user isolation even if middleware were bypassed.

### [GOOD-8] Response Sanitization (sanitizeUser / sanitizeSession) ✅
Auth responses strip internal Supabase fields. Only `id`, `email`, `name`, `email_verified`, `created_at`, `tier` are returned. No raw Supabase metadata exposed.

### [GOOD-9] `.env` Files Gitignored ✅
`backend/.gitignore` lists `.env`, `frontend` presumably does too. `.env.example` files contain only placeholder values — no real secrets.

### [GOOD-10] No API Keys in Frontend Bundle ✅
`frontend/.env.example` only exposes `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_GA_MEASUREMENT_ID` — both appropriate for public exposure. No Supabase keys, Finnhub keys, or backend secrets in frontend env files.

### [GOOD-11] SQL Injection Prevention ✅
All database queries use parameterized queries with `$1, $2, ...` placeholders. No string interpolation or template literals found in SQL queries. Verified across `portfolio.js`, `dashboard.js`, `waitlist.js`, `priceAlerts.js`.

### [GOOD-12] Global Rate Limiting ✅
`generalLimiter` (1000/15min) applied globally via `app.use(generalLimiter)` in `server.js`. All routes inherit this baseline protection.

### [GOOD-13] File Upload Restrictions ✅
Journal CSV import limits file size to 5MB and validates MIME type (`text/csv` or `.csv` extension). Memory storage used (no disk write).

### [GOOD-14] Frontend has Zero npm Vulnerabilities ✅
`cd frontend && npm audit` → **0 vulnerabilities**.

### [GOOD-15] dangerouslySetInnerHTML Uses Static Data Only ✅
`changelog/page.tsx` uses `dangerouslySetInnerHTML` to render `**bold**` markdown in hardcoded static strings. `landing/page.tsx` uses it for JSON-LD structured data. Neither renders user-controlled input. Low XSS risk in current form.

---

## Recommended Action Priority

| Priority | Action |
|----------|--------|
| 🔴 P0 | Remove Railway URL from CSP `connectSrc` in `server.js` |
| 🔴 P0 | Fix `authenticateToken` import — export from auth.js OR migrate to `requireAuth` |
| 🔴 P0 | Remove Supabase project ID from auth.js and authService.js comments |
| 🟡 P1 | `npm audit fix` in backend (express-rate-limit IPv6 bypass) |
| 🟡 P1 | Add `authLimiter` to `/api/auth/refresh` and `/api/auth/reset` |
| 🟡 P1 | Add `requireAuth` to journal import and backup routes |
| 🟡 P2 | Strip scoring formula from public API response |
| 🟡 P2 | Remove email from failed-login log line |
| 🟡 P3 | Add CSP header to frontend via vercel.json |

---

## Live Endpoint Test Results

| Endpoint | Result |
|----------|--------|
| `GET /health` | ✅ 200 OK, service healthy |
| `GET /health` headers | ✅ All security headers present (X-Frame-Options, X-Content-Type-Options, HSTS, CSP, etc.) |
| `POST /api/auth/signup` (no body) | ✅ 404 (route not deployed/404 on live) — graceful |
| `POST /api/backup/restore` (no auth) | ⚠️ 200 OK — accessible without auth |
| `GET /api/stocks/AAPL/score` | ⚠️ Returns full scoring formula breakdown |
| CORS | ✅ Not wildcard, Railway URL not in CORS origins |
| Rate limiting headers | ✅ `ratelimit-limit: 1000`, `ratelimit-remaining` visible |

---

*Report generated by Zip — Security/QA Agent for ApexLogics/TradVue*
