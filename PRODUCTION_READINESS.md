# AI Travel Planner — Production Readiness Report

**Date:** 2026-08-06
**Scope:** architecture, security, auth, persistence, accessibility, loading/empty/error states, API/AI/weather/map reliability, testing, deployment readiness.
**Approach:** full source audit (all API routes, hooks, stores, pages, shared components), verification via static checks + 93 automated tests, findings classified Critical → Low. **Only Critical and High findings were implemented**; Medium/Low are left as recommendations per scope.

---

## 1. Executive Summary

The application is in strong production-ready shape. The three prior passes (test coverage, performance engineering, dead-code cleanup) left a clean, measurable baseline: **85 unit/integration tests + 8 E2E tests green, TSC/lint clean, production build clean**, and initial-load sizes of 211–332 KB gzipped across the seven measured routes.

This audit found **no Critical issues**. Two **High** reliability/security findings were identified and fixed:

| # | Finding | Risk | Fix |
|---|---------|------|-----|
| H1 | AI upstream fetches had no timeout — a hung NVIDIA API request could leave the user's "Preparing…" spinner spinning forever (worst on self-hosted node) | Reliability | `AbortSignal.timeout(50s)` server-side; 45s client-side timeouts with friendly errors |
| H2 | `POST /api/share` parsed the JSON body **before** rate-limiting, with **no body-size cap** (Next route handlers have none) — memory-DoS vector, rate limit bypassable per-request | Security | Rate-limit first; `Content-Length` cap (413) on all four POST routes |

Seven Medium and five Low findings remain as recommendations (Section 4) — primarily pre-existing demo/dead UI on the home and map pages, and small a11y gaps.

---

## 2. Verification Baseline

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | ✅ clean |
| `npm run lint` (ESLint) | ✅ clean |
| `npx vitest run` | ✅ 85/85 (12 files: 6 unit + 6 integration) |
| `npm run build` | ✅ clean |
| `npx playwright test` | ✅ 8/8 (24.7s) |

Performance (gzip transfer bytes, prod `next start`, `playwright.perf.config.ts`): `/` 211 KB · `/plan` 303 KB · `/map` 405 KB · `/itinerary/[id]` 332 KB · `/report` 214 KB · `/budget` 321 KB · `/share` 220 KB. Leaflet (~88 KB) and qrcode (~23 KB) load on demand; Supabase client (~13 KB) only when configured.

---

## 3. Implemented Fixes (High)

### H1 — Hung AI requests can never leave a loading state (Fixed)

A hung NVIDIA API fetch never rejects. On serverless this is eventually cut by `maxDuration` (60s), but self-hosted (`npm start`) it can hang indefinitely, and the client showed no timeout either — `useItinerary`'s "Preparing your itinerary…" screen or the assistant's disabled input could spin forever with no escape.

- `src/lib/ai/nvidia.ts` — `AbortSignal.timeout(50_000)` on the single shared upstream fetch (covers `/api/generate`, `/api/refine`, `/api/chat`).
- `src/hooks/useItinerary.ts:63` — 45s client timeout on `/api/generate`; `TimeoutError` is mapped to "The server took too long to respond. Please try again." instead of a raw error message.
- `src/components/shared/AIAssistantPanel.tsx` — 45s client timeouts on both `/api/refine` and `/api/chat` fetches (typing state always resets).

All timings stay under the 60s `maxDuration` of every AI route.

### H2 — Unbounded request bodies on API routes (Fixed)

Next.js route handlers (unlike Server Actions) impose **no default body-size limit** (confirmed against `node_modules/next/dist/docs/`). `POST /api/share` previously parsed the body to JSON **before** checking the 30/hour rate limit, so a caller could burn unbounded memory per request; the `clientIp` helper trusts the leftmost `x-forwarded-for` value, so on a direct deployment the limit is trivially bypassed by rotating the header.

- `src/app/api/share/route.ts` — rate-limit check moved **before** JSON parsing; `Content-Length` > 500 KB rejected with 413 (share payloads are capped at 400 KB by `validateShareInput` anyway).
- `src/app/api/chat/route.ts` — 100 KB cap (message ≤ 2,000 chars + ≤ 6 history entries of ≤ 4,000 chars can never exceed this).
- `src/app/api/refine/route.ts` — 450 KB cap (itinerary cap is 400 KB + command).
- `src/app/api/generate/route.ts` — 50 KB cap (existing post-parse cap, now enforced pre-parse).

### Hygiene — share store directory ignored (Medium, fixed opportunistically)

`data/shares/*.json` contains public itineraries — including emergency-contact phone numbers, hotel names, and revoke-key hashes. The project has no git repo yet, but once versioned, these must never be committed. Added `/data` to `.gitignore` (`.env*` was already covered).

---

## 4. Remaining Findings (Medium / Low — recommendations only)

### Medium

| # | Finding | Location |
|---|---------|----------|
| M1 | **Dead interactive UI on the landing page** — hero search input accepts typing but does nothing; "AI Travel Chat" button, "See All", and all 8 Quick Action buttons have no `onClick`; Navbar Settings/Notifications/avatar buttons are inert. Users get zero feedback → perceived breakage on the most-visited page. Wire them to real actions or remove them. | `src/app/page.tsx`, `src/components/shared/Navbar.tsx` |
| M2 | **`/map` is a hardcoded Kyoto demo** — static POIs, fixed route, and zoom/locate/navigate/traffic/weather buttons that only display "not connected" toasts, while sitting in the main navigation labeled "Map". Either integrate real trip data or label the page as a demo. | `src/app/map/page.tsx` |
| M3 | `router.replace(next)` is called **during render** in the login page (side-effect in render; double-invoked in Strict Mode). Move into a `useEffect`. | `src/app/auth/login/page.tsx:28` |
| M4 | **AI assistant panel** — message history grows unboundedly (fine locally, but cap at ~50) and new messages aren't announced to screen readers (no `aria-live` region). | `src/components/shared/AIAssistantPanel.tsx` |
| M5 | **Auto-rotating "AI Recommendations"** every 4s with no pause control — WCAG 2.2.2 (pause/stop moving content). | `src/app/page.tsx:520` |
| M6 | **Questionnaire validation gaps** — return date before departure date is accepted; date inputs have no `min`; `<label>` elements aren't associated via `htmlFor`/`id`. | `src/components/questionnaire/TripDetailsStep.tsx` |
| M7 | **CSP `script-src 'unsafe-inline'`** — weakens XSS defense. Next supports nonce-based CSP; adopt it and drop `unsafe-inline`. | `next.config.ts:8` |
| M8 | **`clientIp` trusts leftmost XFF** — ensure the hosting proxy (Vercel/nginx) overwrites `x-forwarded-for`; on a directly-exposed node server the rate limits are spoofable. | `src/lib/rateLimit.ts:22` |

### Low

| # | Finding | Location |
|---|---------|----------|
| L1 | Icon-only map HUD buttons (zoom ±, locate, navigate) lack `aria-label` | `src/app/map/page.tsx` |
| L2 | Floating AI-assistant button lacks `aria-label` | `src/app/itinerary/[id]/page.tsx:286` |
| L3 | `pushAssistantMessage` ids use `Date.now()+1` — can collide for two messages in the same millisecond (React key warning) | `src/components/shared/AIAssistantPanel.tsx:93` |
| L4 | Guest profile shows a "History (local)" stat that is always 0 — misleading | `src/app/profile/page.tsx:258` |
| L5 | `GET /api/share/[token]` un-rate-limited — acceptable today (96-bit tokens make enumeration infeasible; reads are cheap file lookups). Revisit if deployed to multi-tenant hosting | `src/app/api/share/[token]/route.ts` |

---

## 5. Verified-Strong Areas (no action needed)

- **Security:** no `dangerouslySetInnerHTML` anywhere (AI content rendered as text — no XSS path); CSP, `X-Frame-Options: DENY`, `nosniff`, Referrer-Policy, Permissions-Policy headers; 48-hex share tokens + `isValidToken` before every file path operation (no traversal); SHA-256 revoke keys never exposed publicly; revoke-key required to re-publish; rate limits on every paid/stateful endpoint; no PII in error logs (AI provider status codes only); `.env*` ignored; guest-by-default auth degrades cleanly when Supabase is absent.
- **Data safety:** localStorage quota-aware persistence (`pruneOldestPlans`, quota-error detection, 3.5 MB budget); `mergePreserving` in the refine pipeline guarantees the model can never silently shrink an itinerary (dropped days/sections restored verbatim).
- **Reliability:** `AbortController` cancellation in `useWeather`; weather never fabricated (no coords → honest empty state); 10-min browser cache on `/api/weather`; AI parse tolerance (raw JSON → code fences → brace matching); typed error boundaries (`error.tsx`, `global-error.tsx`).
- **UX states:** skeletons with `role="status"` (profile, report, trips), `EmptyState` components with actions on every list, graceful not-found for revoked links (server-rendered `/share/[token]`), print-ready report CSS, `prefers-reduced-motion` + focus-visible rings, `sr-only` usage.
- **Testing:** 85 unit/integration tests cover rate limits, AI parsing/merge preservation, weather mapping, share-store validation/traversal, and API error contracts; 8 E2E tests cover the full critical path (generate → view → share → revoke) and run against a real dev server.

---

## 6. Deployment Checklist (when shipping)

1. **Configure Supabase** (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) — otherwise sharing falls back to ephemeral local files in `data/shares/` which do not survive serverless restarts.
2. **Set `NVIDIA_API_KEY`** — without it, chat/generate/refine return explicit 503/500 degraded responses (by design).
3. **Create the `shared_trips`, `saved_trips`, `trip_history` tables** with RLS (service role bypasses RLS for share creation; user-scoped policies needed for `saved_trips`/`trip_history`).
4. **Persistent rate-limit store** — in-memory limits reset per serverless instance; swap `createSlidingWindowLimiter` for a shared Redis/Supabase store at scale (documented in `src/lib/rateLimit.ts`).
5. **Fix M2 before launch** — a demo map in the primary navigation is the one item that will read as unfinished to end users.
6. **Recommendations M1/M3–M8, L1–L5** are tracked in Section 4 and can be addressed incrementally.
