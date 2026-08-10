-- Adds real tournament results synced from a user's PGA Tour player page.
-- Run this once in the Supabase SQL editor (Project > SQL Editor > New query).
-- Already included in schema.sql for fresh installs.

alter table profiles add column if not exists pga_tour_player_url text;

create table if not exists tournament_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  tournament_name text not null,
  event_date date,
  position text,
  total_score int,
  to_par text,
  earnings text,
  synced_at timestamptz not null default now()
);

alter table tournament_results enable row level security;

create policy "Tournament results are viewable by any signed-in user"
  on tournament_results for select
  using (auth.role() = 'authenticated');

create policy "Users can insert their own synced results"
  on tournament_results for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own synced results"
  on tournament_results for delete
  using (auth.uid() = user_id);

create index if not exists tournament_results_user_idx
  on tournament_results (user_id);
