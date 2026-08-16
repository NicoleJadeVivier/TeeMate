-- Adds Q-School as a fourth tour, plus a stage column for its four
-- qualifying stages. Run this once in the Supabase SQL editor
-- (Project > SQL Editor > New query). Already included in schema.sql
-- for fresh installs.

-- Drop the existing tour check constraint (name found dynamically,
-- since Postgres auto-generates it and it's safer not to assume).
do $$
declare
  con_name text;
begin
  select conname into con_name
  from pg_constraint
  where conrelid = 'tournaments'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) like '%tour%';
  if con_name is not null then
    execute format('alter table tournaments drop constraint %I', con_name);
  end if;
end $$;

alter table tournaments add constraint tournaments_tour_check
  check (tour in ('PGA', 'Korn Ferry', 'Americas', 'Q-School'));

alter table tournaments add column if not exists stage text
  check (stage is null or stage in ('Pre-Qualifying', 'First Stage', 'Second Stage', 'Final Stage'));
