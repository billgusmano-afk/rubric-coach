-- Persist the AI coach summary and session end time so the history page
-- can render a full session detail view without re-running the summary.
alter table public.sessions
  add column if not exists summary text,
  add column if not exists ended_at timestamptz;
