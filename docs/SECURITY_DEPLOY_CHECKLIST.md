# Security Deploy Checklist

**Every deploy must pass these checks before going live.**

## Pre-Deploy (Bolt runs these)

- [ ] `npm audit` — zero critical/high vulnerabilities in frontend AND backend
- [ ] No hardcoded secrets in codebase (`grep -r "sk_live\|password\|secret" --include="*.js" --include="*.ts"`)
- [ ] Any new database tables have RLS enabled with appropriate policies
- [ ] No `.env` files or secrets in git (`git log --all --full-history -- "*.env"`)
- [ ] Backup taken (git tag + database snapshot)

## Post-Deploy

- [ ] Site loads and login works
- [ ] Portfolio data visible for authenticated user
- [ ] API endpoints return proper auth errors for unauthenticated requests
- [ ] No console errors in browser dev tools
- [ ] Supabase RLS linter shows no new violations

## Non-Negotiable Rules

- **Never deploy without a backup** (git tag + tar snapshot)
- **Never expose env vars in client-side code** (check NEXT_PUBLIC_ vars)
- **Never commit secrets to git** — use env vars exclusively
- **Always verify after deploy** — don't claim "done" without checking

---

_Created 2026-03-11. Enforced on every deploy._
