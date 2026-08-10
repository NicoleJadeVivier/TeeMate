-- Adds the `commitments` table to an existing TeeMate database.
-- Run this once in the Supabase SQL editor (Project > SQL Editor > New query).
-- Already included in schema.sql for fresh installs.

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
