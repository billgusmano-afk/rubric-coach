-- Per-turn MMG Quadrant D scoring data, stored on the learner (user) message
-- the score evaluates. Additive only — no RLS changes needed: session_messages
-- policies already key off the parent session.
alter table public.session_messages
  add column if not exists rigor int,
  add column if not exists relevance int,
  add column if not exists quadrant text,
  add column if not exists quadrant_why text,
  add column if not exists acumen int,
  add column if not exists self_orientation int;
