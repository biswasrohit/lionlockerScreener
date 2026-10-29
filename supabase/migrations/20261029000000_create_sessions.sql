-- LionLocker concept test: one row per participant session.
-- Paste this whole file into the Supabase SQL editor and run it once.
--
-- Participants never talk to Supabase directly. The Next.js server writes rows
-- with the service role key, which bypasses RLS. RLS is on with no policies,
-- so the public anon key can read or write nothing.

create table if not exists public.sessions (
  id uuid primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Screener answers
  is_grad text check (is_grad in ('yes', 'no')),
  days_on_campus text check (days_on_campus in ('0', '1-2', '3-4', '5+')),
  carries_laptop text check (carries_laptop in ('yes', 'no')),
  source text check (source in ('team_member', 'class_group', 'friend', 'other')),
  eligible boolean,

  -- Counterbalancing and task data.
  -- tasks is an array in the order the participant saw them:
  -- [{ condition, scenario, started_at, ended_at, duration_sec, answer,
  --    gave_up, confidence, searches: [{ building, duration, at_sec }] }]
  task_order text check (task_order in ('status_quo_first', 'prototype_first')),
  tasks jsonb not null default '[]'::jsonb,

  -- Final questions
  would_use text check (would_use in ('yes', 'maybe', 'no')),
  blocker text,
  completed boolean not null default false,
  finished_at timestamptz,

  -- Team scoring from /results. Kept in their own columns so participant
  -- saves never overwrite them.
  score_status_quo text check (score_status_quo in ('correct', 'partly', 'wrong')),
  score_prototype text check (score_prototype in ('correct', 'partly', 'wrong'))
);

create index if not exists sessions_created_at_idx on public.sessions (created_at);

create or replace function public.sessions_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists sessions_touch_updated_at on public.sessions;
create trigger sessions_touch_updated_at
  before update on public.sessions
  for each row execute function public.sessions_touch_updated_at();

alter table public.sessions enable row level security;

-- No policies on purpose. Also drop the default grants for extra safety.
revoke all on public.sessions from anon, authenticated;
