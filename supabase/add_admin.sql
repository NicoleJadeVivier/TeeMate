-- Adds an admin flag and lets admins delete anyone's post or comment,
-- in addition to their own. Run this once in the Supabase SQL editor
-- (Project > SQL Editor > New query). Already included in schema.sql
-- for fresh installs.

alter table profiles add column if not exists is_admin boolean not null default false;

drop policy if exists "Users can delete their own posts" on posts;
create policy "Users can delete their own posts or admins can delete any"
  on posts for delete
  using (
    auth.uid() = author_id
    or exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

drop policy if exists "Users can delete their own comments" on post_comments;
create policy "Users can delete their own comments or admins can delete any"
  on post_comments for delete
  using (
    auth.uid() = author_id
    or exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

-- Run this once, with your own email, to make yourself an admin:
-- update profiles set is_admin = true
--   where id = (select id from auth.users where email = 'you@example.com');
