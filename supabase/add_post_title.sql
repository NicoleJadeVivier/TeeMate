-- Adds a custom, user-editable title to posts (previously the "title" was
-- just the fixed "Caddie seeking player" / "Player seeking caddie" label).
-- Run this once in the Supabase SQL editor (Project > SQL Editor > New query).
-- Already included in schema.sql for fresh installs.

alter table posts add column if not exists title text;
