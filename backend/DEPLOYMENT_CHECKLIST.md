# TradVue Backend — Render Deployment Checklist

> **Status:** Live on Render  
> **Service:** `tradvue-api` — https://tradvue-api.onrender.com  
> **Plan:** Hobby plan, Starter instance ($7/mo)  
> **Auto-deploy:** GitHub push to `master` triggers a new build automatically.

---

## 🔴 Why Auth Might Be Broken

The `/api/auth/register` and `/api/auth/login` endpoints return **500 Internal Server Error**
when `DATABASE_URL` is not set. The DB pool (`services/db.js`) fails to connect silently at startup,
then every `db.query()` call throws — caught by the route's try/catch and returned as a generic 500.

Always verify `DATABASE_URL` is set in Render dashboard first.

---

## ✅ Environment Variables (set in Render dashboard)

Go to your Render service → **Environment** tab and verify these are set:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | 🔴 **CRITICAL** | Supabase Postgres connection string (Transaction mode, port 6543) |
| `JWT_SECRET` | 🔴 **CRITICAL** | Random 256-bit string — generate with `openssl rand -hex 32` |
| `NODE_ENV` | ✅ Yes | Set to `production` |
| `PORT` | ✅ Yes | Set to `10000` (Render's default expected port) |
| `FINNHUB_API_KEY` | ✅ Yes | From https://finnhub.io — real-time market data |
| `ALPHA_VANTAGE_API_KEY` | Optional | From https://www.alphavantage.co |
| `NEWS_API_KEY` | Optional | From https://newsapi.org (RSS feeds work without it) |
| `FRED_API_KEY` | Optional | From https://fred.stlouisfed.org/docs/api/api_key.html |
| `ETHERSCAN_API_KEY` | Optional | From https://etherscan.io — crypto on-chain data |
| `EXCHANGE_RATES_API_KEY` | Optional | From https://exchangeratesapi.io |
| `ADMIN_KEY` | Optional | Internal admin endpoint auth key |
| `JWT_EXPIRE` | Optional | Default: `24h` |
| `JWT_REFRESH_EXPIRE` | Optional | Default: `7d` |

> **PORT note:** Render injects its own port, but setting `PORT=10000` explicitly ensures
> the app binds to the right port. The app already reads `process.env.PORT || 3001`.

### Getting the Supabase DATABASE_URL

In Supabase dashboard → **Settings → Database → Connection string**:
- Choose **Transaction** mode (port **6543**) for serverless/pooled connections
- Format: `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`
- ⚠️ Do NOT use port 5432 (direct connection) for production

---

## 🚀 Deployment Steps

Render auto-deploys on push to `master`. For a manual deploy:

1. Go to https://dashboard.render.com → **tradvue-api**
2. Click **Manual Deploy** → **Deploy latest commit**
3. Watch the **Logs** tab for build and startup output

### Verify after deploy:

```bash
# Health check
curl https://tradvue-api.onrender.com/health
# Expected: {"status":"OK","timestamp":"...","service":"TradVue API"}

# Auth test
curl -X POST https://tradvue-api.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}'
# Expected: 201 with JWT token
```

---

## 🔍 Debugging

If you get 500s after deploy:

1. **Check Render logs** — look for:
   - `[DB] ❌ PostgreSQL connection failed:` → `DATABASE_URL` is wrong or unreachable
   - `[DB] ✅ PostgreSQL connected` → DB is fine, bug is elsewhere

2. **Common mistakes**:
   - Using Supabase direct URL (port 5432) instead of pooler (6543)
   - `PORT` not set to `10000` (Render won't route traffic correctly)
   - `DATABASE_URL` has a trailing space or newline
   - Forgetting to URL-encode special characters in the password

3. **Quick test** — hit `/health` first. If that returns OK, the server is running.
   If auth still fails, it's the DB connection.

---

## 📁 File Reference

| File | Purpose |
|---|---|
| `Dockerfile` | Docker build config for Render |
| `.env.example` | All env vars documented with descriptions |
| `services/db.js` | PostgreSQL pool — reads `DATABASE_URL` |
| `routes/auth.js` | Register + login endpoints |
| `server.js` | App entrypoint |

> **Note:** `railway.json` and `.railwayignore` remain in the repo for historical reference
> but are no longer used. Render uses the `Dockerfile` for deployment.

---

_Last updated: 2026-03-11 — Zip, ApexLogics_
