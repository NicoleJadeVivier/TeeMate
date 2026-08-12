-- Adds comments on posts.
-- Run this once in the Supabase SQL editor (Project > SQL Editor > New query).
-- Already included in schema.sql for fresh installs.

create table if not exists post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

alter table post_comments enable row level security;

create policy "Comments are viewable by any signed-in user"
  on post_comments for select
  using (auth.role() = 'authenticated');

create policy "Users can add comments as themselves"
  on post_comments for insert
  with check (auth.uid() = author_id);

create policy "Users can delete their own comments"
  on post_comments for delete
  using (auth.uid() = author_id);

create index if not exists post_comments_post_idx
  on post_comments (post_id, created_at);
