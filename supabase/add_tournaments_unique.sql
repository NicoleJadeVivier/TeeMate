-- Prevents future schedule refreshes from deleting tournaments (and, via
-- cascade, any posts/comments/commitments attached to them). Adds a unique
-- key so the scraper can upsert existing tournaments in place instead of
-- deleting and recreating the whole table.
-- Run this once in the Supabase SQL editor (Project > SQL Editor > New query).
-- Already included in schema.sql for fresh installs.

alter table tournaments add constraint tournaments_unique_event
  unique (name, tour, start_date);
