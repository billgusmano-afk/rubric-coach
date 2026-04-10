-- Add new session setup fields for the revised roleplay UI
alter table public.sessions
  add column if not exists partner_name text,
  add column if not exists partner_role text,
  add column if not exists partner_solution text,
  add column if not exists relationship_stage text,
  add column if not exists meeting_type text,
  add column if not exists proposal text,
  add column if not exists objective text,
  add column if not exists expected_objection text,
  add column if not exists disc_profile text default 'D',
  add column if not exists disc_blend text default 'single',
  add column if not exists document_context text,
  add column if not exists voice_enabled boolean default true,
  add column if not exists mic_enabled boolean default false;
