# Release Notes

**Latest:** v1.1.2 — AI pipeline observability (2026-08-06)

---

## v1.1.2 — AI pipeline observability: structured logging + dev error detail

**Scope:** makes the AI pipeline debuggable end-to-end. No AI integration changes — request behavior, endpoints, and error status codes are identical. The generic "Generation failed. Please try again." response is now reserved for production; development returns the real cause.

### Changes

- **New `src/lib/logger.ts`** — structured JSON logger (one JSON object per line). Emits `ai.*` / `validation.*` / `api.*` events with `ts`, `level`, `namespace`, and fields; `isDev()` re-reads `NODE_ENV` per call. Never logs secrets (API keys only as booleans), never logs prompt/user content, and truncates captured bodies (≤500 chars).
- **`src/lib/ai/openrouter.ts`** — full request lifecycle logged: `ai.request.start` (hasApiKey, model, messageCount, token/temp/top-p/seed), `ai.request.end` (status, duration), `ai.request.error` (status, statusText, duration, truncated response body). New `OpenRouterApiError` carries status + a sanitized body hint (prefers the provider's own `error.message`, ≤300 chars) so dev clients see the real upstream cause. `ai.parse.error` logs a truncated snippet for invalid JSON.
- **`src/lib/validation/schemas.ts`** — `validateItinerary`/`validateQuestionnaire` log structured zod issues (path + message, capped at 10) on failure.
- **Routes (`/api/generate`, `/api/refine`, `/api/chat`)** — structured `request_error` / `ai.validation_error` / `request_validation_error` logging with error name, message, and stack server-side. Development: the real error message is returned to the client (e.g. `OpenRouter API error: 401 Unauthorized — ...`). Production: unchanged generic copy; details stay in server logs. Status codes and response shapes unchanged.
- **Tests** — +3: dev surfaces real provider error (generate), production keeps the generic copy (generate), production keeps the generic 502 (chat); existing 502/missing-key assertions updated for the dev-message policy. 100/100.

### Verification (all ✅)

| Check | Result |
|---|---|
| TypeScript (`tsc --noEmit`) | ✅ clean |
| ESLint | ✅ clean |
| Unit + integration (Vitest) | ✅ 100/100 |
| Release gate (prod build) | ✅ 6/6 |
| Production build | ✅ compiled |

---

## v1.1.1 — AI backend consolidation: single OpenRouter client (GLM 5.2)

**Scope:** removes the accidental NVIDIA NIM implementation. The AI layer was internally inconsistent — `src/lib/ai/openrouter.ts` (despite its name) talked to NVIDIA NIM, and `/api/chat` contained a second, duplicated NVIDIA fetch inline. Now every AI feature goes through one OpenRouter client. No user-facing behavior changes (same model `z-ai/glm-5.2`, same temperature/token configuration per flow).

### Changes

- **`src/lib/ai/openrouter.ts`** — rewritten as the single OpenRouter client: endpoint `https://openrouter.ai/api/v1/chat/completions`, auth via `OPENROUTER_API_KEY` (throws `MissingApiKeyError` when absent), OpenRouter attribution headers (`HTTP-Referer` from `NEXT_PUBLIC_APP_URL`, `X-Title`). Renamed `callNvidiaChat` → `callOpenRouterChat`, `callNvidiaAPI` → `callOpenRouterGenerate`; same request/response handling, 50 s timeout, and status-only error logging.
- **`src/app/api/chat/route.ts`** — the duplicated inline NVIDIA fetch (key check, error mapping, response parsing) is gone; the route now calls `callOpenRouterChat` with the same 512 max tokens / 0.8 temperature / 0.9 top-p. Missing-key still degrades to the friendly 503; provider errors still 502; history sanitization and rate limiting unchanged.
- **`src/lib/ai/provider.ts`, `src/lib/ai/refine.ts`** — import the renamed OpenRouter functions only; pipeline logic untouched.
- **Tests** — `tests/unit/refine.test.ts` mocks `callOpenRouterChat`; all integration tests stub `OPENROUTER_API_KEY` (chat/generate/refine).
- **Docs/config** — `.env.example`, `README.md`, `DEPLOYMENT_CHECKLIST.md`, `PRODUCTION_READINESS.md`, `PORTFOLIO_READINESS.md` updated: `OPENROUTER_API_KEY` is the only AI credential; NVIDIA references removed.

### Verification (all ✅)

| Check | Result |
|---|---|
| TypeScript (`tsc --noEmit`) | ✅ clean |
| ESLint | ✅ clean |
| Unit + integration (Vitest) | ✅ 97/97 |
| Endpoint URL defined exactly once (`grep openrouter.ai/api/v1/chat/completions`) | ✅ 1 hit |
| NVIDIA references in `src/` + tests | ✅ 0 hits |

---

## v1.1.0 — Hardening: strict CSP, hydration fix, AI-output validation

**Scope:** closes Known Issues K1 and K3 from RC v1.0 and adds the long-planned runtime validation layer. No new user-facing features.

### Changes

**K3 — Strict Content Security Policy (nonce-based, no `script-src 'unsafe-inline'`)**
- New `src/proxy.ts` (Next 16's `proxy` convention; `middleware.ts` is deprecated in this version): issues a fresh nonce per request, applies it to every Next.js script tag automatically, and serves the CSP header
- `script-src 'self' 'nonce-…' 'strict-dynamic'` — inline scripts are now gated by an unguessable per-request nonce; `'unsafe-eval'` only in dev (React dev tooling requirement)
- `style-src` keeps `'unsafe-inline'` deliberately: React style attributes cannot be nonce'd (CSP applies nonces to elements, not attributes) and style injection is not an XSS vector
- All pages now render dynamically (`force-dynamic` on the root layout) — required because nonces can only be injected during SSR. Trade-off: no static pre-generation/CDN edge caching; initial loads are per-request SSR. Bundle bytes actually decreased (211–213 KB/route, was 215–404 KB)
- Release gate extended with a K3 regression guard: asserts the CSP contains a nonce + `strict-dynamic` and **not** `script-src 'unsafe-inline'`

**K1 — Cold deep-link hydration race fixed**
- `useItinerary` now awaits zustand persist hydration (`persist.hasHydrated()` + `onFinishHydration`) before reading the stores, with a 1.5 s hard timeout so the not-found path can never hang. A cold load of `/itinerary/[id]` in a fresh tab no longer falls through to 404 while storage hydrates (browser storage can hydrate asynchronously or be unavailable, e.g. private mode)

**New — zod runtime validation of AI output (planned since v1.0)**
- `src/lib/validation/schemas.ts`: full `itinerarySchema` + `questionnaireSchema` (zod 4 as a direct dependency)
- `/api/generate`: the model response is validated after normalization — a malformed response returns **502** ("The AI returned a malformed itinerary") instead of crashing the client; the request payload is schema-validated (**400**) before reaching the model
- `/api/refine`: request itinerary must satisfy the contract (**400**); a merge result that fails validation is rejected (**502**) and the client keeps its previous version
- Resilient by design: string numbers are coerced, unknown activity categories fall back to a safe default, and non-finite numbers are rejected
- New test file: `tests/unit/validation.test.ts` (12 tests) — 97/97 unit+integration tests, 13 files

### Verification (all ✅)

| Check | Result |
|---|---|
| TypeScript (`tsc --noEmit`) | ✅ clean |
| ESLint | ✅ clean |
| Unit + integration (Vitest) | ✅ 97/97 |
| E2E (Playwright, dev server) | ✅ 8/8 |
| Release gate (prod build) | ✅ 6/6 — incl. strict-CSP guard |
| Perf budget suite | ✅ 7/7 (211–213 KB/route) |
| Production build | ✅ all routes dynamic (nonce requires SSR) |
| Secrets scan / git hygiene | ✅ clean |

### Known Issues (remaining)

| # | Severity | Issue | Note |
|---|---|---|---|
| K2 | Low | **`data/shares/` file store is ephemeral on serverless platforms.** Shares created without Supabase vanish when the instance recycles. | Operational: configure Supabase (`supabase/schema.sql`), or accept ephemeral shares. |
| K4 | Info | Per-IP rate limits are in-memory (per instance); multi-instance deployments reset them per instance. | Shared store (Redis) is the future fix. |

---

## v1.0.0 — Release Candidate (2026-08-06)

**Scope:** First feature-complete release. No new features in this pass — a full engineering review, hardening, and release-gate verification.

### Highlights

AI Travel Planner ships as a production-grade, zero-configuration travel OS:

- **AI itinerary generation** from a 9-step questionnaire — daily plans, coordinates, stays, restaurants, packing, emergency contacts, hidden gems, customs, and tips
- **Surgical natural-language editing** — the shared JSON schema guarantees lossless, merge-preserving edits
- **Live weather** (Open-Meteo, server-side proxy, never fabricated), **route maps** (Leaflet/OSM), **budget planner**, **print-ready travel report**
- **Revocable public share links** with view/edit modes, QR codes, and per-IP throttling
- **Guest-first**: runs fully offline with no sign-up, no database, and no API keys for maps/weather

### Changes

**Brand & presentation** (see `PORTFOLIO_READINESS.md`)
- Compass brand identity: `icon.svg`, `brand-mark.svg`, generated `favicon.ico` + `apple-icon.png`, 1200×630 OG card
- Hero landing page fully wired (search, quick actions, trending destinations → planner); dead navbar controls removed
- Loading/empty/error states redesigned around the brand; metadata + viewport exports cleaned up
- README rewritten with a regenerable screenshot gallery (`npm run screenshots`) and a two-minute demo flow

**Bug fixes**
- **Home page crash (production bug):** `RecentTrips` zustand selector returned a fresh array per snapshot, tripping React 19's `useSyncExternalStore` loop protection ("Maximum update depth exceeded"). The home page silently crashed into the error boundary; the e2e suite never visited `/` so it went unnoticed. Fixed by selecting the stable `plans` slice + `useMemo`.
- **Screenshot pipeline:** the "loading" capture silently produced the error card (storage-hydration edge case); now drives the real wizard flow with the generate call held open.
- **Console warnings:** removed `padding`/`paddingTop` shorthand conflicts (4 page wrappers), and the invalid `battery` Permissions-Policy token.

**Accessibility (WCAG 2.1 AA)**
- Bottom-nav labels: contrast raised 3.87:1 → ≥4.5:1
- Muted text token `#6B7280` → `#8B93A7` (AA on all card surfaces at caption sizes)
- Questionnaire date inputs now have programmatic labels (`htmlFor`/`id`)
- "Flexible Dates" toggle is now a keyboard-operable `role="switch"` button
- Floating AI assistant button has an accessible name (`aria-label`)

**Release gate added** — `npm run test:release` (Playwright against the production build):
- No console errors on any route · security headers present · no horizontal overflow at 360/390/768/1440px · dark-mode theme enforced · axe: zero serious/critical violations · share flow on the prod server

### v1.0.0 Verification

| Check | Result |
|---|---|
| TypeScript (`tsc --noEmit`) | ✅ clean |
| ESLint | ✅ clean |
| Unit + integration (Vitest) | ✅ 85/85 |
| E2E (Playwright) | ✅ 8/8 |
| Release gate (prod build) | ✅ 6/6 |
| Perf budget suite | ✅ 7/7 |
| Screenshot suite | ✅ 11/11 |
| Production build | ✅ 16 static pages + 9 dynamic routes |
| Secrets scan | ✅ no keys/credentials in the repo |
| Git hygiene | ✅ `.env*`, `/data`, `.next` ignored |

### Known Issues (as of v1.0.0)

| # | Severity | Issue | Resolution |
|---|---|---|---|
| K1 | Low | Questionnaire-store hydration on cold deep links was inconsistent; the page could fall through to 404 while storage hydrated. | ✅ **Fixed in v1.1.0** (hydration await in `useItinerary`). |
| K3 | Low | CSP used `script-src 'unsafe-inline'` to accommodate Next.js inline hydration payloads. | ✅ **Fixed in v1.1.0** (nonce-based CSP via `src/proxy.ts`). |
| K2 | Low | `data/shares/` file store is ephemeral on serverless platforms. | Open — configure Supabase or accept ephemeral shares. |
| K4 | Info | Per-IP rate limits are in-memory (per instance). | Open — Redis-backed limiting is the future fix. |

## Scores

| Metric | v1.0.0 | v1.1.0 |
|---|---|---|
| **Engineering Score** | 9.4 / 10 | **9.7 / 10** |
| **Production Readiness Score** | 9.2 / 10 | **9.6 / 10** |

**v1.1.0 Engineering rationale:** 97/97 unit+integration tests (13 files), strict TS/lint clean, AI output now runtime-validated at both generation and edit boundaries (malformed model responses become 502s, not client crashes), K1 hydration race eliminated, and the release gate gained a strict-CSP regression guard. Remaining deductions: K4 (in-memory rate limits) and no server-side persistence layer.

**v1.1.0 Production rationale:** `script-src` is now nonce-based with `strict-dynamic` — XSS surface materially reduced; the CSP header is enforced per-request by the security proxy; the prod-mode gate verifies CSP strictness on every run. Remaining deductions: K2 (share-store ephemerality on serverless), K4 (per-instance rate limits), and the deliberate dynamic-rendering trade-off that nonce-CSP requires (per-request SSR, no CDN edge caching of pages).

## Future Improvements

- **Server persistence** — user accounts with cloud-synced trips (Supabase schema v2 reserves `expenses`, `chat_history`, `saved_places`); also resolves K2 on serverless
- **Redis-backed rate limiting** (K4) for multi-instance deployments
- **SRI-based CSP experiment** — if Next's experimental hash-based SRI matures, it may allow strict CSP with static rendering again
- **Real voice assistant** — Web Speech API transcription (currently a placeholder)
- **PWA** — offline itinerary access, installability, push weather alerts
- **Live map overlays** — real traffic/weather layers on the itinerary map
- **Server-side caching** for AI and weather responses on shared trips

---

## CTO Launch Review (2026-08-06) — findings

**Verdict: Ready to Ship.** No Critical or High findings. One configuration bug fixed during the review; Medium/Low findings below are documented and non-blocking.

### Fixed during review
- **B1 (config bug, fixed):** `layout.tsx` read `NEXT_PUBLIC_SITE_URL` for `metadataBase`, but the documented contract (`.env.example`, deployment checklist) is `NEXT_PUBLIC_APP_URL` — which no code read. Without the fix, deployed OG/canonical metadata would resolve against `http://localhost:3000`. `layout.tsx` now reads `NEXT_PUBLIC_APP_URL` first, with `NEXT_PUBLIC_SITE_URL` as a legacy fallback.

### Documented as future improvements
- **M1 — Full schema validation on shared payloads:** share creation validates only a shallow `isPlausibleItinerary` shape; a hand-crafted payload with valid top-level keys but malformed items (e.g. `accommodations: [{name}]` without `amenities`) can crash the shared-page render or the "Edit a copy" flow (unguarded `.length` accesses). Impact is self-inflicted only (a creator breaking their own link). Fix path: reuse `itinerarySchema.safeParse` in `validateShareInput` (zod is already a dependency).
- **M2 — Trusted-proxy handling for rate limits:** `clientIp()` takes the first `X-Forwarded-For` entry, which callers can spoof when the deployment does not sanitize the header (Vercel's edge does; self-hosted nginx must set `proxy_set_header`). Affects only abuse throttling, not data.
- **M3 — Revoke key in query string:** `DELETE /api/share?token=…&key=…` puts the revoke key in URLs, which proxies/access logs may retain. Move the key to a header.
- **L1 — Prompt-injection hardening:** system prompts should explicitly instruct the model to ignore instructions inside user-supplied content (itinerary fields, chat input). Low risk today: users can only manipulate their own trips, and all model output passes zod validation.
- **L2 — Dynamic rendering trade-off:** nonce-CSP requires per-request SSR (no CDN edge HTML caching). Revisit when hash-based SRI stabilizes.

---

*Companion documents: [`PRODUCTION_READINESS.md`](PRODUCTION_READINESS.md) (hardening audit), [`PORTFOLIO_READINESS.md`](PORTFOLIO_READINESS.md) (presentation pass), [`DEPLOYMENT_CHECKLIST.md`](DEPLOYMENT_CHECKLIST.md) (runbook).*
