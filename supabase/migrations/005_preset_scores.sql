-- 005: Persist preset-framework criterion scores in session_scores.
-- Preset frameworks (human-edge, meddic, ...) live in code (src/lib/frameworks.ts),
-- so their criteria have no rows in public.criteria. Allow session_scores rows
-- without a criterion UUID and carry the preset identity/name/weight inline.

alter table public.session_scores
  alter column criterion_id drop not null;

alter table public.session_scores
  add column if not exists preset_framework_id text,
  add column if not exists preset_criterion_id text,
  add column if not exists preset_criterion_name text,
  add column if not exists weight_percent numeric(5,2);

-- Every score row must reference either a DB criterion or a preset criterion.
-- Postgres has no "add constraint if not exists", so guard manually to keep
-- this migration safely re-runnable.
do $$
begin
  alter table public.session_scores
    add constraint session_scores_criterion_ref check (
      criterion_id is not null or preset_criterion_id is not null
    );
exception
  when duplicate_object then null;
end $$;

create index if not exists idx_session_scores_preset_criterion
  on public.session_scores(preset_criterion_id)
  where preset_criterion_id is not null;

-- RLS: existing policies ("View own session scores" / "Insert own session scores",
-- see 002_reset_and_recreate.sql) key off session_id -> sessions.user_id = auth.uid()
-- and are column-agnostic, so no policy changes are needed.
