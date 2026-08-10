-- Adds the `career_highlights` column to an existing TeeMate database.
-- Run this once in the Supabase SQL editor (Project > SQL Editor > New query).
-- Already included in schema.sql for fresh installs.

alter table profiles add column if not exists career_highlights text;
