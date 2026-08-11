<div align="center">

<img src="public/brand-mark.svg" width="96" height="96" alt="AI Travel Planner logo" />

# AI Travel Planner

**An intelligent travel OS — generate, refine, budget, share, and explore personalized AI-crafted itineraries.**

[![Next.js](https://img.shields.io/badge/Next.js%2016-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![React 19](https://img.shields.io/badge/React%2019-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript%20strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind%20CSS%20v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![NVIDIA NIM](https://img.shields.io/badge/AI-NVIDIA%20NIM-76B900?logo=nvidia&logoColor=white)](https://build.nvidia.com)
[![Vitest](https://img.shields.io/badge/tests-Vitest-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev)
[![Playwright](https://img.shields.io/badge/e2e-Playwright-2EAD33?logo=playwright&logoColor=white)](https://playwright.dev)

🌐 **[Live Demo — Coming Soon](#)**


[![GitHub](https://img.shields.io/badge/GitHub-sharma9655v-181717?logo=github&logoColor=white)](https://github.com/sharma9655v)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Vashudev%20Sharma-0A66C2?logo=linkedin&logoColor=white)](https://www.linkedin.com/in/vashudev-sharma-bb094a398/)

</div>

---

## 📖 Overview

AI Travel Planner turns a short questionnaire into a **personalized, day-by-day travel itinerary** using AI, live travel data, interactive maps, weather information, budgeting tools, and optional cloud features.

The application is designed around a structured itinerary schema, allowing generated trips to be validated, refined, rendered, saved, and shared consistently.

Built on the Next.js App Router with a strict TypeScript core, the app treats AI output as a *data contract*: the generator and a "surgical editor" share one JSON schema, so edits are precise, lossless, and always renderable.

**Core ideas**

- **AI as a data contract** — one shared itinerary schema drives generation, editing, validation, and rendering.
- **Surgical editing** — natural-language commands (`"More nightlife"`, `"Remove hiking"`) apply precise, lossless edits to an existing trip.
- **First usable itinerary** — fast AI output is served first; slower live data (hotels, restaurants, events, daily routes) is added in the background afterwards.
- **Honest by design** — prices are approximate ranges, weather is never fabricated, and private user data is never used in cache keys.
- **Guest-first UX** — the core experience works without an account. Maps and weather use keyless public services, while AI credentials remain server-side.

---

## 💡 Why I Built It

Travel planning often means switching between multiple tools for destinations, activities, weather, routes, restaurants, budgets, and trip organization.

I built **AI Travel Planner** to bring these pieces together into one experience.

The project evolved from an AI itinerary generator into a complete travel-planning platform with structured AI generation, itinerary refinement, maps, weather, POI discovery, budgeting, sharing, authentication, caching, and performance optimization.

A major focus during development was making AI generation **fast, reliable, and structured** — fast enough to feel responsive, and reliable enough that the output always parses, validates, and renders.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🧭 **AI Itinerary Generator** | 9-step questionnaire → complete trip: daily plan, activities with coordinates, accommodations, restaurants, packing checklist, emergency contacts, hidden gems, local customs |
| ✏️ **Surgical Itinerary Editor** | Natural-language edits that preserve everything the command doesn't touch |
| 💬 **AI Travel Assistant** | Conversational chat for itinerary changes and travel advice |
| 💰 **Budget Planner** | 6-category budget model — AI estimates rolled into consistent ranges, with derived fallbacks and savings suggestions |
| 🌤️ **Live Weather** | Open-Meteo integration with WMO-code mapping, 16-day forecast, and travel advice derived server-side |
| 🗺️ **Route Map** | Leaflet + OpenStreetMap plotting every activity, stay, restaurant, and hidden gem with valid coordinates |
| 🔗 **Trip Sharing** | Public share links with view/edit modes, secret revoke keys, 400 KB payload cap, and per-IP throttling |
| 📄 **Travel Report** | Print-optimized, PDF-ready trip summary |
| ⭐ **Favorites & History** | Per-trip favorites and activity history (cloud-backed when signed in) |
| 🔐 **Auth (optional)** | Google/GitHub OAuth via Supabase with a guest-first experience |
| ✉️ **Email Itinerary** | Send generated itineraries by email through the optional SMTP integration |
| 🌙 **Design system** | Dark glassmorphism UI, brand compass mark, motion design, skeletons, empty states, print styles |

---

## 📸 Screenshots

> All captures below are real browser screenshots produced by `npm run screenshots` (Playwright against a live dev server, seeded with a complete itinerary).


### Core Experience

| Home | Questionnaire | Itinerary |
|:---:|:---:|:---:|
| ![Home](docs/screenshots/home.png) | ![Questionnaire](docs/screenshots/planner.png) | ![Itinerary](docs/screenshots/itinerary.png) |

| Budget Planner | Route Map | Mobile |
|:---:|:---:|:---:|
| ![Budget](docs/screenshots/budget.png) | ![Map](docs/screenshots/map.png) | ![Mobile](docs/screenshots/itinerary-mobile.png) |

More screenshots and UI states are available in [`docs/screenshots`](docs/screenshots/).

---

## ⭐ Key Highlights

- ⚡ **Fast AI generation** — measured average of ~10.8s in local benchmarking
- 🧠 **Structured AI output** — JSON normalization + Zod schema validation
- ✏️ **Natural-language refinement** — modify itineraries without rebuilding them
- 📍 **POI caching** — destination-based caching with request deduplication
- 🌤️ **Live weather** — Open-Meteo integration
- 🗺️ **Interactive maps** — Leaflet + OpenStreetMap
- 🔗 **Shareable itineraries** — secure, revocable links
- 🔐 **Server-side credentials** — API keys never exposed to the browser
- 🧪 **Automated testing** — Vitest + Playwright coverage

---

## 💡 What Makes It Different?

AI Travel Planner is designed as more than an AI text generator.

The application combines:

- structured AI generation
- schema validation
- measurable AI performance optimization
- parallel travel-data fetching
- destination-level caching
- in-flight request deduplication
- background enrichment
- interactive maps
- live weather
- natural-language itinerary refinement
- secure itinerary sharing

The goal is to make AI-generated travel planning feel like a reliable product rather than a simple chatbot.

---

## 🛠️ Tech Stack

**Core**

- **Next.js 16** (App Router, Turbopack) · **React 19** · **TypeScript** (strict)
- **Tailwind CSS v4** + a tokenized dark glassmorphism design system
- **Zustand** with persistent, versioned localStorage stores
- **Framer Motion** — animation + layout transitions

**AI & Data**

- **NVIDIA NIM** — configurable LLM provider for itinerary generation, refinement, and chat
- **Open-Meteo** — free, keyless live weather
- **Leaflet + OpenStreetMap** — interactive route maps
- **Overpass API** — public POI discovery from OpenStreetMap
- **OSRM** — road routes between a day's stops
- **Ticketmaster** — dated events (optional)
- **Supabase** *(optional)* — auth + cloud persistence (service-role adapter for shares)

**Dev**

- ESLint (flat config) · Vitest (unit/integration) · Playwright (e2e + screenshots + perf + release gate) · `next/font` (Inter) · `lucide-react`

---

## 👨‍💻 My Contribution

I designed and developed the AI Travel Planner as an independent project.

| Area | My Work |
|---|---|
| Product | Product concept and feature planning |
| UI/UX | Interface, design system, responsive experience |
| Frontend | Next.js, React, TypeScript architecture |
| AI | Prompt design, structured generation, JSON normalization, validation |
| Backend | API routes and server-side integrations |
| Maps | Leaflet + OpenStreetMap |
| Weather | Open-Meteo integration |
| Data | POI discovery, caching, request deduplication |
| Authentication | Supabase + OAuth architecture |
| Testing | Vitest + Playwright |
| Performance | AI latency and request optimization |
| Deployment | Production deployment architecture |

Third-party libraries and external services (Next.js, React, Leaflet, OpenStreetMap, Open-Meteo, NVIDIA NIM, Supabase, and the rest of the dependency tree) are the work of their respective authors — my role was integration, architecture, and the product itself.

---

## 🏗️ Architecture

```mermaid
flowchart LR
    Q[Questionnaire\n(Zustand persisted)] -->|POST /api/generate| GEN[AI Pipeline]
    GEN -->|shared JSON schema| P[Parse + normalize + validate]
    P --> UI[Itinerary UI]
    UI -->|command| REF[POST /api/refine\nSurgical Editor]
    UI -->|GET /api/weather| W[Open-Meteo]
    UI -->|POST /api/share| SH[Share Store\nfile ↔ Supabase adapter]
    SH -->|public GET /share/[token]| PUB[Public page]
    GEN -.->|background| ENR[POST /api/enrich\nhotels · restaurants · events · routes]
```

**Design decisions**

- **Client-first data flow.** The itinerary lives in a versioned, size-budgeted localStorage store (`atp:itineraries:v1`) with automatic pruning — users are never locked out by quota.
- **Storage adapter seam.** Trip sharing works with zero configuration (file store under `data/shares/`) and upgrades to Supabase (`shared_trips` with RLS) purely by setting environment variables.
- **Provider abstraction.** Generation, editing, and chat all flow through one LLM client with a strict JSON-response contract.
- **Parallel, non-fatal context.** Geocoding, weather, places, and the arrival route run concurrently during generation; each degrades to an honest fallback instead of failing the request. Only the AI itself is on the critical path.

```
AI flow:  questionnaire → context (parallel, cached) → LLM → JSON → normalize → validate → assemble → render
Enrich:   hotels / restaurants / events / daily routes → background, additive, idempotent
Edit:     command + full itinerary → surgical prompt → LLM → merge-preserving diff → persist
```

---

## 🤖 AI Pipeline

**Provider:** NVIDIA NIM (OpenAI-compatible endpoint)  
**Current configuration:** `meta/llama-3.1-8b-instruct` for all three flows (see [Environment variables](#-environment-variables))

The pipeline is optimized for the **first usable itinerary**:

```text
Questionnaire
     ↓
Travel context (geocode · weather · places · arrival route — parallel & cached)
     ↓
Fast AI model
     ↓
JSON normalization (wrappers, day maps, bare day lists)
     ↓
Schema validation (Zod)
     ↓
Initial itinerary
     ↓
Render
     ↓
Optional background enrichment (hotels · restaurants · events · daily routes)
```

Key properties:

- Independent travel-data requests run in parallel.
- Optional enrichment never blocks the initial generation.
- The AI call is retried only when its *output* was unusable (parse/validation failure) — provider errors (timeouts, 5xx) fail fast instead of doubling latency.
- Structured JSON output (`response_format`) is used on generation calls when the configured model supports it.
- Every external stage (weather, places, routes, cache, enrichment) can fail without blocking the initial itinerary.

---

## ⚡ Performance

Performance optimization was a major part of the development process.

The initial reasoning-heavy model was replaced for fast itinerary generation after live benchmarking showed excessive latency.

### Measured Model Comparison

Measured on the same destination against a live NVIDIA endpoint (`scripts/measure-generation.ts`). Performance varies with provider load, API availability, network conditions, and environment — these are observed results, not guarantees.

| Model | Generation Time | Failure Rate |
|---|---:|---:|
| NVIDIA Nemotron (reasoning-class, earlier config) | 53–124s | ~22% |
| **Llama 3.1 8B Instruct** (current config) | **6.8–18.6s** | **0%** |

### Latest Benchmark (Llama 3.1 8B)

- **Average generation:** 10.83s
- **Median:** 8.96s
- **Minimum:** 6.80s
- **Maximum:** 18.57s
- **Failures:** 0/5

> These are measured benchmark results for a specific destination and environment. Actual latency depends on provider load, API availability, network conditions, and hardware/environment. The app does not guarantee any fixed latency.

Beyond the model, the architecture contributes to perceived speed:

- Parallel, cached travel-data requests on the critical path.
- POI caching with 7-day TTL and in-flight request deduplication.
- Background enrichment that keeps slower data out of the first render.
- A 60-second upstream timeout with SDK retries disabled, so slow providers surface quickly instead of hanging.
- `perf/route-bytes.spec.ts` enforces route-level JS bundle budgets against the production build.

---

## 🔌 API Architecture

All AI endpoints are rate-limited per IP and validate input before processing. Errors are returned as `{ error }` JSON.

| Route | Method | Purpose |
|---|---|---|
| `/api/generate` | POST | Fast initial itinerary generation |
| `/api/refine` | POST | Modify an existing itinerary via natural language |
| `/api/chat` | POST | AI travel assistant |
| `/api/weather` | GET | Weather forecast proxy (Open-Meteo) |
| `/api/enrich` | POST | Optional background travel enrichment |
| `/api/share` | POST | Create a shared itinerary link |
| `/api/share/[token]` | GET · DELETE | Retrieve / revoke a shared itinerary |
| `/api/itineraries/[id]` | GET · DELETE | Reserved route for saved itinerary persistence |
| `/api/email-itinerary` | POST | Email itinerary delivery (SMTP) |

Route handlers are thin: domain logic lives in `src/lib/`, and every route applies a sliding-window rate limit before parsing the request body.

---

## 📂 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── generate/
│   │   ├── refine/
│   │   ├── chat/
│   │   ├── weather/
│   │   ├── enrich/
│   │   ├── share/
│   │   └── email-itinerary/
│   ├── plan/
│   ├── itinerary/
│   ├── budget/
│   ├── map/
│   └── profile/
│
├── components/
├── hooks/
├── lib/
│   ├── ai/
│   ├── planning/
│   ├── cache/
│   ├── validation/
│   ├── weather/
│   ├── sharing/
│   └── db/
│
├── types/
│
tests/
├── unit/
├── integration/
└── e2e/

perf/
docs/
supabase/

```

See the repository for the complete project structure.
---

## 🚀 Installation

**Prerequisites:** Node.js 20+ and npm.

```bash
git clone https://github.com/sharma9655v/ai-travel-planner
cd ai-travel-planner
npm install
```

---

## 🔑 Environment Variables

Copy `.env.example` to `.env.local` and fill in what you need. Only `NVIDIA_API_KEY` is required for AI generation — everything else is optional and the app degrades gracefully without it. **Never commit `.env.local`.**

| Variable | Required | Purpose |
|---|---|---|
| `NVIDIA_API_KEY` | ✅ | NVIDIA NIM API key (generate/refine/chat fail fast without it) |
| `AI_FAST_MODEL` | — | Model for initial itinerary generation |
| `AI_STRONG_MODEL` | — | Model for refinement / complex edits |
| `AI_CHAT_MODEL` | — | Model for the conversational assistant |
| `AI_REASONING_BUDGET` | — | Optional reasoning budget for reasoning-class models (0 = off) |
| `AI_REQUEST_TIMEOUT_MS` | — | Upstream AI request timeout (default 60 s) |
| `AI_JSON_MODE` | — | Toggle structured JSON output (on by default) |
| `CACHE_PROVIDER` | — | `memory` (default) or `upstash` |
| `CACHE_REDIS_REST_URL` / `CACHE_REDIS_REST_TOKEN` | — | Upstash Redis REST credentials |
| `CACHE_ENABLED` | — | Set `false` to disable the cache entirely |
| `POI_CACHE_TTL_SECONDS` | — | Override the 7-day POI cache TTL |
| `GENERATION_TIMINGS` | — | Emit per-phase generation timings in production logs |
| `NEXT_PUBLIC_APP_URL` | — | Public origin for share links and OAuth redirects |
| `NOMINATIM_SEARCH_URL` / `OVERPASS_API_URL` / `OSRM_BASE_URL` / `OPEN_METEO_URL` | — | Override live-data provider endpoints |
| `PLANNER_USER_AGENT` | — | Identifying User-Agent for OSM/Overpass clients |
| `TICKETMASTER_API_KEY` | — | Optional dated events provider |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | — | Supabase auth + cloud sync |
| `SUPABASE_SERVICE_ROLE_KEY` | — | Service-role key for the Supabase share adapter |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | — | Email itinerary delivery |

Models are selected through environment variables — the current environment is configured with `meta/llama-3.1-8b-instruct` for generation, refinement, and chat.

---

## 🧑‍💻 Running Locally

```bash
npm run dev             # start Turbopack dev server
npm run build           # production build
npm run start           # serve the production build
npx tsc --noEmit        # type check
npm run lint            # ESLint
```

The app supports a guest-first local experience. AI generation requires the NVIDIA API key, while maps and weather use keyless public services. Local sharing and persistence can work without Supabase.

---

## 🧪 Testing

```bash
npm run test            # Vitest (unit + integration)
npm run test:e2e        # Playwright end-to-end
npm run test:release    # release gate vs. the production build (console/headers/a11y/responsive)
npm run test:all        # everything above
npm run screenshots     # regenerate docs/screenshots/*.png + brand icons
```

- **Vitest — 155 tests passing (21 files)** covering AI parsing, itinerary normalization, the generation pipeline, enrichment, budget logic, weather mapping, caching, OSM/Overpass, sharing, rate limiting, and every API route.
- **Playwright e2e — 8 critical flows**: wizard → generate, refine, report, weather, map, save/persistence, share/revoke, and fixture sanity.
- **Screenshot pipeline** — drives the real UI (including the true AI loading flow through the questionnaire) and regenerates every image in this README.
- **Perf suite** — `perf/route-bytes.spec.ts` enforces route-level JS bundle budgets against the production build.

---

## 🗺️ Maps · Weather · POI Architecture

**Maps — Leaflet + OpenStreetMap**
- Interactive route maps plot every activity, stay, restaurant, and hidden gem that carries valid coordinates.
- `react-leaflet` with marker clustering; demo map shows honest notices when no route data exists.

**Weather — Open-Meteo**
- Keyless forecast API — no API key required.
- 16-day forecast with WMO-code mapping and travel advice derived server-side.
- Cached for 15 minutes; a failing weather request degrades gracefully.

**POI discovery — Overpass API**
- Places, hotels, and restaurants are discovered via OpenStreetMap's Overpass API using destination-coordinate-based queries.
- Requests carry an identifying User-Agent (required by OSM policy) and a 20-second timeout; an optional fallback instance is used on provider-level failures.
- Successful results are cached for 7 days (configurable via `POI_CACHE_TTL_SECONDS`); **failed or null results are never cached**, so a bad day at the provider doesn't poison the cache.
- Cache keys are built from normalized destination coordinates only — **private user data is never part of a cache key**.
- Concurrent identical requests share one in-flight request (deduplication), so two simultaneous trips to the same city don't issue duplicate Overpass queries.
- Cache hits avoid unnecessary Overpass requests entirely; a broken cache degrades to a live fetch.

---

## 🛡️ Security

- `.env.local` is gitignored and must never be committed.
- API keys and provider credentials remain server-side.
- Private user information is never included in public POI cache keys.
- Share links use secure, revocable tokens.
- API routes use rate limiting and request-size protection.
- No authenticated Google sessions or cookies are used for automated data collection.
- External services are used according to their Terms of Service, rate limits, and access policies.

---

## ☁️ Deployment

The app is a standard Next.js 16 project and can be deployed to any Node.js host (Vercel, Netlify, Railway, a VPS, etc.).

- For serverless hosts, set `CACHE_PROVIDER=upstash` so the cache is shared across instances (the default `memory` provider is per-instance).
- For sharing at scale, configure Supabase so `shared_trips` are stored in Postgres instead of the local file store.
- Environment variables are injected at deploy time from `.env.example` — never bake secrets into the image.
- See `DEPLOYMENT_CHECKLIST.md` and `PRODUCTION_READINESS.md` in the repository for the full production hardening audit.

---

## 🛡️ Production Readiness

The app ships hardened out of the box — see [PRODUCTION_READINESS.md](PRODUCTION_READINESS.md) for the full audit:

- **AI resilience** — 60 s upstream timeout with SDK retries disabled, fast-fail on provider errors, graceful error states.
- **Request hardening** — rate limiting before body parsing, Content-Length caps (413) on all POST routes.
- **Share security** — secure tokens, revocation, and per-IP throttling.
- **CSP & headers** — strict security headers with no `dangerouslySetInnerHTML` anywhere.
- **Storage safety** — versioned stores with quota-budgeted pruning; `/data` is gitignored.
- **Release gate** — a Playwright release config checks console errors, headers, a11y, and responsive behavior against the production build.

---

## 🗺️ Roadmap

Ideas I'm working toward next:

- Server-side saved-itinerary lookup (`/api/itineraries/[id]` is currently a stub — persistence is client-side).
- Full cloud trip sync behind Supabase auth.
- Additional AI providers and model presets behind the existing env-configurable seam.
- User accounts for share-link analytics (views, revokes).

---

## 👨‍💻 Creator

### Vashudev Sharma

**AI/ML Developer · Full-Stack Developer · UI/UX Designer**

AI Travel Planner is an independent project designed and developed by **Vashudev Sharma**.

The project covers, end to end:

- Product concept and feature planning
- UI/UX, design system, and responsive experience
- Frontend architecture (Next.js, React, TypeScript, Zustand, motion)
- AI integration, prompt design, and structured generation
- JSON normalization and schema validation
- Backend/API architecture and server-side integrations
- Maps (Leaflet + OpenStreetMap) and weather (Open-Meteo)
- POI discovery via Overpass
- Caching and in-flight request deduplication
- Performance optimization of the AI pipeline
- Testing (Vitest + Playwright) and deployment architecture

- **GitHub:** https://github.com/sharma9655v
- **LinkedIn:** https://www.linkedin.com/in/vashudev-sharma-bb094a398/

> Built with a focus on practical AI, structured generation, performance, and a polished travel experience.

Contributions and feedback are welcome through GitHub issues and pull requests.

---

<div align="center">

### Built by Vashudev Sharma


[GitHub](https://github.com/sharma9655v) ·
[LinkedIn](https://www.linkedin.com/in/vashudev-sharma-bb094a398/)

</div>
