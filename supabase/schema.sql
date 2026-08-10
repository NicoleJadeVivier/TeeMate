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
  career_highlights text,
  avatar_url text,
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
-- COMMITMENTS
-- A caddie or player marking themselves as committed to a
-- tournament, so others can see who's in and message them.
-- ============================================================
create table if not exists commitments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  tournament_id uuid not null references tournaments(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, tournament_id)
);

alter table commitments enable row level security;

create policy "Commitments are viewable by any signed-in user"
  on commitments for select
  using (auth.role() = 'authenticated');

create policy "Users can commit themselves to a tournament"
  on commitments for insert
  with check (auth.uid() = user_id);

create policy "Users can remove their own commitment"
  on commitments for delete
  using (auth.uid() = user_id);

create index if not exists commitments_tournament_idx
  on commitments (tournament_id);

-- ============================================================
-- AVATARS
-- Public storage bucket for profile photos, scoped so a user can
-- only write files under their own user-id folder.
-- ============================================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update their own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete their own avatar"
  on storage.objects for delete
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

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
