-- Persist the AI client persona system prompt server-side so it can't be
-- tampered with from the browser, plus the config the session page needs
-- to rehydrate after a refresh (sessionStorage lost).
alter table public.sessions
  add column if not exists system_prompt text,
  add column if not exists preset_framework_ids text[] not null default '{}',
  add column if not exists company_research jsonb;
