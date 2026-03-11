# TradVue — Production Deployment Guide

> **Provider:** Render (backend) + Vercel (frontend) + Supabase (database)  
> **Updated:** 2026-03-11 by Zip, ApexLogics  
> **Deploy:** `git push origin master` — both frontend and backend auto-deploy.

---

## Architecture

```
tradvue.com (DNS → Vercel)
       │
       ▼
  Vercel (Next.js frontend)
  NEXT_PUBLIC_API_URL ──────────────────────────────────────►
                                                    Render (Express backend)
                                                    https://tradvue-api.onrender.com
                                                            │
                                              ┌─────────────┼──────────────┐
                                              ▼             ▼              ▼
                                          Supabase      Finnhub API    RSS/FRED
                                         PostgreSQL    (market data)   (news/calendar)
```

---

## Pre-flight Checklist ✅

- [x] Backend `package.json` has `"start": "node server.js"`
- [x] `backend/Dockerfile` configured (node:22-slim, exposes 3001, healthcheck on `/health`)
- [x] `frontend/vercel.json` configured (Next.js, security headers)
- [x] `frontend/next.config.js` updated (removed deprecated `appDir` flag)
- [x] Frontend builds clean (`npm run build` — 0 errors)
- [x] All backend syntax validated (0 errors)
- [x] Code committed to git

---

## Step 1: Push to GitHub

Both Render and Vercel deploy from GitHub. Ensure your repo is pushed:

```bash
cd /Users/mini1/.openclaw/workspace/tradingplatform
git push origin master
```

---

## Step 2: Deploy Backend to Render

### Dashboard Setup (one-time)

1. Go to **https://dashboard.render.com** → **New → Web Service**
2. Connect GitHub → select the `tradingplatform` repo
3. Configure:

| Field | Value |
|-------|-------|
| **Name** | `tradvue-api` |
| **Region** | `Oregon (US West)` |
| **Branch** | `master` |
| **Language** | `Docker` |
| **Dockerfile Path** | `./backend/Dockerfile` |
| **Build Context** | `./backend` |
| **Instance Type** | `Starter ($7/mo)` |

4. Click **Advanced** → set **Health Check Path** to `/health`

### Environment Variables (set in Render dashboard → Environment tab)

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `JWT_SECRET` | `<generate: openssl rand -hex 32>` |
| `JWT_EXPIRE` | `24h` |
| `DATABASE_URL` | `<Supabase Transaction mode URL, port 6543>` |
| `FINNHUB_API_KEY` | `<from https://finnhub.io>` |
| `NEWS_API_KEY` | `<from https://newsapi.org>` |
| `FRED_API_KEY` | `<from https://fred.stlouisfed.org>` |
| `ALPHA_VANTAGE_API_KEY` | `<from https://alphavantage.co>` |
| `ADMIN_KEY` | `<generate: openssl rand -hex 16>` |

> ⚠️ Mark sensitive vars (JWT_SECRET, DATABASE_URL, API keys) as **Secret** in Render.

5. Click **Create Web Service** — Render builds and deploys automatically.
6. Service URL: `https://tradvue-api.onrender.com`

### Auto-deploy

After initial setup, Render auto-deploys on every `git push origin master`. No further action needed.

---

## Step 3: Deploy Frontend to Vercel

> ⚠️ **Do Step 2 first** — you need the Render backend URL before deploying the frontend.

### Dashboard Setup (one-time)

1. Go to **https://vercel.com** → **Add New Project** → Import your repo
2. Set **Root Directory** to: `frontend`
3. Framework auto-detected as **Next.js**

**Set Environment Variable:**

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://tradvue-api.onrender.com/api` |

4. Click **Deploy**

### Auto-deploy

Vercel auto-deploys on every `git push origin master`. No further action needed.

---

## Step 4: Verify Production

```bash
# 1. Backend health check
curl https://tradvue-api.onrender.com/health
# Expected: {"status":"OK","timestamp":"...","service":"TradVue API"}

# 2. Real market data (AAPL quote)
curl https://tradvue-api.onrender.com/api/market-data/quote/AAPL

# 3. Auth — Register
curl -X POST https://tradvue-api.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@tradvue.com","password":"TestPass123!","name":"Test User"}'

# 4. Frontend
open https://tradvue.com
```

---

## Step 5: Point tradvue.com DNS to Vercel

In your domain registrar (or Cloudflare):

### Root domain
- **A record**: `@` → `76.76.19.61` (Vercel's IP)
- OR **CNAME** (if registrar supports flattening): `@` → `cname.vercel-dns.com`

### www subdomain
- **CNAME**: `www` → `cname.vercel-dns.com`

### In Vercel Dashboard
1. Project → **Settings** → **Domains**
2. Add `tradvue.com` and `www.tradvue.com`
3. Vercel auto-provisions SSL (Let's Encrypt)

---

## Notes & Known Considerations

1. **Redis**: Backend uses in-memory cache fallback when Redis is unavailable — fine for current scale. Add Render Redis add-on later for persistence.

2. **CORS**: `server.js` allows `tradvue.com` origin in production. The old Railway URL (`tradvue-production.up.railway.app`) is kept in `allowedOrigins` for 48h during cutover stabilization.

3. **Render cold starts**: Starter plan ($7/mo) never spins down. Do NOT use Free tier — it spins down after 15 min inactivity causing 30–60s cold starts.

4. **Vercel pricing**: Free Hobby tier handles the frontend. Pro needed only if >100GB bandwidth/mo.

5. **Supabase**: `DATABASE_URL` configured with `ssl: { rejectUnauthorized: false }` — works with Supabase out of the box. Use port **6543** (Transaction mode), not 5432.

---

## Summary: What Triggers a Deploy

| Action | Result |
|--------|--------|
| `git push origin master` | Both Render + Vercel auto-deploy |
| Render dashboard → Manual Deploy | Backend only |
| Vercel dashboard → Redeploy | Frontend only |

No CLI needed. No manual steps. Just push.

---

*Last updated: 2026-03-11 by Zip*
