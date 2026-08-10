-- TeeMate database schema
-- Run this in the Supabase SQL editor (Project > SQL Editor > New query)

-- ============================================================
-- PROFILES
-- One row per user, created right after sign-up.
-- ============================================================
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('caddie', 'player')),
  full_name text not null,
  bio text,
  location text,
  years_experience int,
  preferred_tours text[] default '{}', -- e.g. {'PGA','Korn Ferry','Americas'}
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Profiles are viewable by any signed-in user"
  on profiles for select
  using (auth.role() = 'authenticated');

create policy "Users can insert their own profile"
  on profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

-- ============================================================
-- TOURNAMENTS
-- Seeded/updated manually or via a scheduled job for now, since
-- PGA Tour / Korn Ferry / PGA Tour Americas don't expose a public
-- schedule API. Anyone signed in can read; only you (via the
-- Supabase dashboard, or a future admin role) writes to this table.
-- ============================================================
create table if not exists tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tour text not null check (tour in ('PGA', 'Korn Ferry', 'Americas')),
  location text not null,
  start_date date not null,
  end_date date not null,
  created_at timestamptz not null default now()
);

alter table tournaments enable row level security;

create policy "Tournaments are viewable by any signed-in user"
  on tournaments for select
  using (auth.role() = 'authenticated');

-- ============================================================
-- POSTS
-- A caddie looking for a player, or a player looking for a caddie,
-- tied to a specific tournament.
-- ============================================================
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles(id) on delete cascade,
  post_type text not null check (post_type in ('caddie_seeking_player', 'player_seeking_caddie')),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  details text,
  status text not null default 'open' check (status in ('open', 'filled', 'closed')),
  created_at timestamptz not null default now()
);

alter table posts enable row level security;

create policy "Posts are viewable by any signed-in user"
  on posts for select
  using (auth.role() = 'authenticated');

create policy "Users can create their own posts"
  on posts for insert
  with check (auth.uid() = author_id);

create policy "Users can update their own posts"
  on posts for update
  using (auth.uid() = author_id);

create policy "Users can delete their own posts"
  on posts for delete
  using (auth.uid() = author_id);

-- ============================================================
-- MESSAGES
-- Simple direct messaging between two users. thread_id is a
-- deterministic pairing of the two user ids (smaller uuid first)
-- so both people query the same thread.
-- ============================================================
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  thread_id text not null,
  sender_id uuid not null references profiles(id) on delete cascade,
  recipient_id uuid not null references profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

alter table messages enable row level security;

create policy "Users can view messages they sent or received"
  on messages for select
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

create policy "Users can send messages as themselves"
  on messages for insert
  with check (auth.uid() = sender_id);

-- Helpful index for loading a thread in order
create index if not exists messages_thread_created_idx
  on messages (thread_id, created_at);

-- ============================================================
-- REALTIME
-- Enable realtime so the Messages page gets new messages live.
-- ============================================================
alter publication supabase_realtime add table messages;
