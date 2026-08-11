# Deployment Checklist — v1.1.0

Hardening release. Use this runbook for each environment (preview, production).

---

## 0. Pre-flight (required)

- [ ] `git status` clean — only intended files staged
- [ ] `npm ci` from lockfile
- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `npm run lint` → 0 errors
- [ ] `npm run test` → 97/97 passing
- [ ] `npm run test:e2e` → 8/8 passing
- [ ] `npm run test:release` → 6/6 passing (production build gate, incl. strict-CSP guard)
- [ ] `npm run build` → compiles clean
- [ ] Secrets scan: no API keys or credentials in tracked files

## 1. Environment variables

| Variable | Required | Value |
|---|---|---|
| `NVIDIA_API_KEY` | ✅ production | NVIDIA NIM key — never commit, add via platform secret store |
| `NEXT_PUBLIC_APP_URL` | ✅ production | Canonical origin (used for share/auth redirects) |
| `NEXT_PUBLIC_SUPABASE_URL` | optional | Enables auth + cloud features |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | optional | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | optional | Server-only share-store adapter |
| `MONGODB_URI` | optional | Reserved (future) |

- [ ] Verify the app fails fast with a clear message when `NVIDIA_API_KEY` is missing (expected at generation time only)

## 2. Data & services

- [ ] (Recommended) Supabase configured + `supabase/schema.sql` applied → activates OAuth and moves shares to `shared_trips` (RLS)
- [ ] Without Supabase: shares use `data/shares/` (file store)
  - Vercel/serverless: shares are **ephemeral** — accepted for RC (Known Issue K2)
  - Self-host: mount `data/` on persistent storage; directory is gitignored

## 3. Deploy

**Vercel**
- [ ] `vercel` (link project) · `vercel env add ...` for each variable · `vercel --prod`
- [ ] Build log: "Compiled successfully", no warnings-as-errors

**Docker (self-host)**
- [ ] Build: `docker build -t ai-travel-planner:1.1.2 .`
- [ ] Run: `-p 3000:3000 -v <persistent-dir>:/app/data -e NVIDIA_API_KEY=...`
- [ ] Health check: `curl -sf http://localhost:3000/` → 200

## 4. Post-deploy verification (smoke)

- [ ] `curl -I https://<origin>/` → headers present:
  - `content-security-policy` (nonce-based from `src/proxy.ts`: contains `default-src 'self'`, `frame-ancestors 'none'`, `'nonce-`, `'strict-dynamic'`; **not** `script-src 'unsafe-inline'`)
  - `x-frame-options: DENY` · `x-content-type-options: nosniff`
  - `referrer-policy: strict-origin-when-cross-origin`
- [ ] Browser console on `/`: zero CSP violation messages (proves nonce injection works)
- [ ] Home loads, hero CTAs navigate to `/plan`
- [ ] Full wizard run with a real API key → itinerary renders with weather + map
- [ ] Natural-language edit works ("More nightlife")
- [ ] Share link: create → open in incognito → content renders → revoke → link dies
- [ ] Report page prints to PDF cleanly
- [ ] OG card resolves: `<meta property="og:image" content=".../og-card.png">` (1200×630)
- [ ] `favicon.ico` / `apple-icon.png` / `icon.svg` serve 200s
- [ ] Mobile pass: no horizontal scroll at 390px on home, plan, itinerary
- [ ] Lighthouse smoke: performance + accessibility ≥ 90 (target)

> **Note:** pages are now server-rendered per request (`force-dynamic` for nonce CSP) — there is no CDN edge caching of HTML. Acceptable at this scale; revisit if SRI-based CSP matures (see RELEASE_NOTES → Future Improvements).

## 5. Rollback

- [ ] Vercel: previous production deployment is one click away (`vercel rollback`)
- [ ] Docker: previous image tag retained; redeploy with the old tag
- [ ] No data migration is required (client-first storage; schema v1 unchanged)

---

*See [`RELEASE_NOTES.md`](RELEASE_NOTES.md) for verification results, known issues, and scores.*
