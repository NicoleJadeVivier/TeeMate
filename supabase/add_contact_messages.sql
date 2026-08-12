-- Adds a contact_messages table for the public Contact page.
-- Anyone (logged in or not) can submit a message; only you can read
-- them, via the Supabase dashboard (Table Editor / SQL Editor), since
-- there's deliberately no select policy for the anon/authenticated API.
-- Run this once in the Supabase SQL editor (Project > SQL Editor > New query).
-- Already included in schema.sql for fresh installs.

create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default now()
);

alter table contact_messages enable row level security;

create policy "Anyone can submit a contact message"
  on contact_messages for insert
  with check (true);
