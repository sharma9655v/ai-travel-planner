-- ============================================================
-- AI Travel Planner — Supabase Auth schema
-- Run this in the Supabase SQL editor (or `supabase db push`).
--
-- After applying:
--   1. Enable "Google" and "GitHub" providers under
--      Authentication → Providers (set Google/GitHub OAuth apps
--      and redirect URL  <app>/auth/callback ).
--   2. Copy project URL + anon key into .env.local:
--        NEXT_PUBLIC_SUPABASE_URL=
--        NEXT_PUBLIC_SUPABASE_ANON_KEY=
-- ============================================================

-- Saved trips: one row per itinerary id per user.
create table if not exists public.saved_trips (
  id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  itinerary jsonb not null,
  questionnaire jsonb,
  favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (id, user_id)
);

alter table public.saved_trips enable row level security;

drop policy if exists "users select own trips" on public.saved_trips;
create policy "users select own trips"
  on public.saved_trips for select
  using (auth.uid() = user_id);

drop policy if exists "users insert own trips" on public.saved_trips;
create policy "users insert own trips"
  on public.saved_trips for insert
  with check (auth.uid() = user_id);

drop policy if exists "users update own trips" on public.saved_trips;
create policy "users update own trips"
  on public.saved_trips for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "users delete own trips" on public.saved_trips;
create policy "users delete own trips"
  on public.saved_trips for delete
  using (auth.uid() = user_id);

-- Trip history: one row per event (generated / viewed / edited).
create table if not exists public.trip_history (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  trip_id text not null,
  action text not null check (action in ('generated', 'viewed', 'edited')),
  created_at timestamptz not null default now()
);

create index if not exists trip_history_user_created_idx
  on public.trip_history (user_id, created_at desc);

alter table public.trip_history enable row level security;

drop policy if exists "users select own history" on public.trip_history;
create policy "users select own history"
  on public.trip_history for select
  using (auth.uid() = user_id);

drop policy if exists "users insert own history" on public.trip_history;
create policy "users insert own history"
  on public.trip_history for insert
  with check (auth.uid() = user_id);

-- ============================================================
-- v2 — Database Architect pass
-- ============================================================

-- ------------------------------------------------------------
-- Shared trip links (public read-only / editable payloads).
-- Written only by the service role via src/lib/db/shareStore.ts
-- (the app falls back to the local file store data/shares/ until
-- Supabase + SUPABASE_SERVICE_ROLE_KEY are configured).
-- Anyone can read the public columns; the revoke hash must
-- never be exposed to anon/authenticated roles.
-- ------------------------------------------------------------
create table if not exists public.shared_trips (
  token text primary key,
  trip_id text not null,
  mode text not null check (mode in ('view', 'edit')),
  itinerary jsonb not null,
  revoke_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shared_trips_created_idx
  on public.shared_trips (created_at desc);

alter table public.shared_trips enable row level security;
alter table public.shared_trips force row level security;

-- Any visitor may read a shared link — that is the point of sharing.
drop policy if exists "anyone can read shared trips" on public.shared_trips;
create policy "anyone can read shared trips"
  on public.shared_trips for select
  using (true);

-- Default grants give anon/authenticated full DML; strip it so links can
-- only be created/updated/revoked server-side (service role bypasses RLS).
revoke all on public.shared_trips from anon, authenticated;
grant select (token, trip_id, mode, itinerary, created_at, updated_at)
  on public.shared_trips to anon, authenticated;

-- ------------------------------------------------------------
-- Per-trip expenses. Reserved for the upcoming expense tracker —
-- the current budget planner is read-only AI estimates.
-- ------------------------------------------------------------
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  trip_id text not null,
  category text not null
    check (category in ('accommodation', 'food', 'transport', 'activities', 'shopping', 'emergency', 'other')),
  description text not null default '',
  amount numeric not null check (amount >= 0),
  currency text not null default 'USD',
  spent_on date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists expenses_user_trip_idx
  on public.expenses (user_id, trip_id);

alter table public.expenses enable row level security;

drop policy if exists "users select own expenses" on public.expenses;
create policy "users select own expenses"
  on public.expenses for select
  using (auth.uid() = user_id);

drop policy if exists "users insert own expenses" on public.expenses;
create policy "users insert own expenses"
  on public.expenses for insert
  with check (auth.uid() = user_id);

drop policy if exists "users update own expenses" on public.expenses;
create policy "users update own expenses"
  on public.expenses for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "users delete own expenses" on public.expenses;
create policy "users delete own expenses"
  on public.expenses for delete
  using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- Per-user AI chat history. Reserved for the assistant panel,
-- which currently keeps messages in memory.
-- ------------------------------------------------------------
create table if not exists public.chat_history (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists chat_history_user_created_idx
  on public.chat_history (user_id, created_at desc);

alter table public.chat_history enable row level security;

drop policy if exists "users select own chat history" on public.chat_history;
create policy "users select own chat history"
  on public.chat_history for select
  using (auth.uid() = user_id);

drop policy if exists "users insert own chat history" on public.chat_history;
create policy "users insert own chat history"
  on public.chat_history for insert
  with check (auth.uid() = user_id);

-- ------------------------------------------------------------
-- User-pinned places. Reserved for a saved-places feature on
-- the map view.
-- ------------------------------------------------------------
create table if not exists public.saved_places (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  address text,
  lat double precision,
  lng double precision,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists saved_places_user_created_idx
  on public.saved_places (user_id, created_at desc);

alter table public.saved_places enable row level security;

drop policy if exists "users select own places" on public.saved_places;
create policy "users select own places"
  on public.saved_places for select
  using (auth.uid() = user_id);

drop policy if exists "users insert own places" on public.saved_places;
create policy "users insert own places"
  on public.saved_places for insert
  with check (auth.uid() = user_id);

drop policy if exists "users update own places" on public.saved_places;
create policy "users update own places"
  on public.saved_places for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "users delete own places" on public.saved_places;
create policy "users delete own places"
  on public.saved_places for delete
  using (auth.uid() = user_id);
