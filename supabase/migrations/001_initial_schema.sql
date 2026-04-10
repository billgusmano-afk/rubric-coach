-- ============================================================
-- RubricCoach — Full Database Schema
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- ===================
-- 1. TABLES
-- ===================

-- Users profile (extends auth.users)
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Teams
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Team members
create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null default 'member' check (role in ('admin', 'member')),
  created_at timestamptz not null default now(),
  unique (team_id, user_id)
);

-- Frameworks (rubrics)
create table public.frameworks (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  created_by uuid not null references public.users(id) on delete cascade,
  name text not null,
  description text,
  selling_motion text,
  is_template boolean not null default false,
  created_at timestamptz not null default now()
);

-- Criteria within a framework
create table public.criteria (
  id uuid primary key default gen_random_uuid(),
  framework_id uuid not null references public.frameworks(id) on delete cascade,
  name text not null,
  description text,
  weight_percent integer not null default 0,
  display_order integer not null default 0
);

-- Score level descriptors (1-5) for each criterion
create table public.score_levels (
  id uuid primary key default gen_random_uuid(),
  criterion_id uuid not null references public.criteria(id) on delete cascade,
  level integer not null check (level between 1 and 5),
  label text not null,
  description text,
  unique (criterion_id, level)
);

-- Roleplay sessions
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  framework_ids uuid[] not null default '{}',
  company_name text,
  client_contact text,
  scenario_type text,
  duration_seconds integer,
  overall_score numeric(5,2),
  created_at timestamptz not null default now()
);

-- Per-criterion scores for a session
create table public.session_scores (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  criterion_id uuid not null references public.criteria(id) on delete cascade,
  score integer not null check (score between 1 and 5),
  ai_feedback text
);

-- Chat messages within a session
create table public.session_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

-- Subscriptions (Stripe billing)
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text not null default 'base' check (plan in ('base', 'pro')),
  status text not null default 'active',
  framework_slots integer not null default 1,
  current_period_end timestamptz,
  unique (team_id)
);

-- ===================
-- 2. ROW LEVEL SECURITY
-- ===================

alter table public.users enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.frameworks enable row level security;
alter table public.criteria enable row level security;
alter table public.score_levels enable row level security;
alter table public.sessions enable row level security;
alter table public.session_scores enable row level security;
alter table public.session_messages enable row level security;
alter table public.subscriptions enable row level security;

-- Helper: get all team IDs the current user belongs to
create or replace function public.get_my_team_ids()
returns setof uuid
language sql
security definer
stable
as $$
  select team_id from public.team_members where user_id = auth.uid()
$$;

-- USERS: users can read/update their own profile
create policy "Users can view own profile"
  on public.users for select using (id = auth.uid());

create policy "Users can update own profile"
  on public.users for update using (id = auth.uid());

create policy "Users can insert own profile"
  on public.users for insert with check (id = auth.uid());

-- TEAMS: members can read their teams, owners can update
create policy "Team members can view their teams"
  on public.teams for select using (id in (select public.get_my_team_ids()));

create policy "Authenticated users can create teams"
  on public.teams for insert with check (owner_id = auth.uid());

create policy "Team owners can update their teams"
  on public.teams for update using (owner_id = auth.uid());

-- TEAM_MEMBERS: members can see fellow members, admins can manage
create policy "Team members can view members"
  on public.team_members for select using (team_id in (select public.get_my_team_ids()));

create policy "Team admins can insert members"
  on public.team_members for insert with check (
    team_id in (
      select tm.team_id from public.team_members tm
      where tm.user_id = auth.uid() and tm.role = 'admin'
    )
  );

create policy "Team admins can delete members"
  on public.team_members for delete using (
    team_id in (
      select tm.team_id from public.team_members tm
      where tm.user_id = auth.uid() and tm.role = 'admin'
    )
  );

-- FRAMEWORKS: team members can read, team members can create
create policy "Team members can view frameworks"
  on public.frameworks for select using (team_id in (select public.get_my_team_ids()));

create policy "Team members can create frameworks"
  on public.frameworks for insert with check (
    team_id in (select public.get_my_team_ids()) and created_by = auth.uid()
  );

create policy "Framework creators can update"
  on public.frameworks for update using (created_by = auth.uid());

create policy "Framework creators can delete"
  on public.frameworks for delete using (created_by = auth.uid());

-- CRITERIA: access follows framework access
create policy "View criteria via framework"
  on public.criteria for select using (
    framework_id in (select id from public.frameworks where team_id in (select public.get_my_team_ids()))
  );

create policy "Insert criteria via framework"
  on public.criteria for insert with check (
    framework_id in (select id from public.frameworks where created_by = auth.uid())
  );

create policy "Update criteria via framework"
  on public.criteria for update using (
    framework_id in (select id from public.frameworks where created_by = auth.uid())
  );

create policy "Delete criteria via framework"
  on public.criteria for delete using (
    framework_id in (select id from public.frameworks where created_by = auth.uid())
  );

-- SCORE_LEVELS: access follows criteria -> framework
create policy "View score levels"
  on public.score_levels for select using (
    criterion_id in (
      select c.id from public.criteria c
      join public.frameworks f on f.id = c.framework_id
      where f.team_id in (select public.get_my_team_ids())
    )
  );

create policy "Insert score levels"
  on public.score_levels for insert with check (
    criterion_id in (
      select c.id from public.criteria c
      join public.frameworks f on f.id = c.framework_id
      where f.created_by = auth.uid()
    )
  );

create policy "Update score levels"
  on public.score_levels for update using (
    criterion_id in (
      select c.id from public.criteria c
      join public.frameworks f on f.id = c.framework_id
      where f.created_by = auth.uid()
    )
  );

create policy "Delete score levels"
  on public.score_levels for delete using (
    criterion_id in (
      select c.id from public.criteria c
      join public.frameworks f on f.id = c.framework_id
      where f.created_by = auth.uid()
    )
  );

-- SESSIONS: users can manage their own sessions
create policy "Users can view own sessions"
  on public.sessions for select using (user_id = auth.uid());

create policy "Users can create own sessions"
  on public.sessions for insert with check (user_id = auth.uid());

create policy "Users can update own sessions"
  on public.sessions for update using (user_id = auth.uid());

-- SESSION_SCORES: access follows session
create policy "View own session scores"
  on public.session_scores for select using (
    session_id in (select id from public.sessions where user_id = auth.uid())
  );

create policy "Insert own session scores"
  on public.session_scores for insert with check (
    session_id in (select id from public.sessions where user_id = auth.uid())
  );

-- SESSION_MESSAGES: access follows session
create policy "View own session messages"
  on public.session_messages for select using (
    session_id in (select id from public.sessions where user_id = auth.uid())
  );

create policy "Insert own session messages"
  on public.session_messages for insert with check (
    session_id in (select id from public.sessions where user_id = auth.uid())
  );

-- SUBSCRIPTIONS: team members can view, admins can manage
create policy "Team members can view subscription"
  on public.subscriptions for select using (team_id in (select public.get_my_team_ids()));

create policy "Team admins can update subscription"
  on public.subscriptions for update using (
    team_id in (
      select tm.team_id from public.team_members tm
      where tm.user_id = auth.uid() and tm.role = 'admin'
    )
  );

-- ===================
-- 3. INDEXES
-- ===================

create index idx_team_members_team_id on public.team_members(team_id);
create index idx_team_members_user_id on public.team_members(user_id);
create index idx_frameworks_team_id on public.frameworks(team_id);
create index idx_frameworks_created_by on public.frameworks(created_by);
create index idx_frameworks_created_at on public.frameworks(created_at);
create index idx_criteria_framework_id on public.criteria(framework_id);
create index idx_score_levels_criterion_id on public.score_levels(criterion_id);
create index idx_sessions_user_id on public.sessions(user_id);
create index idx_sessions_created_at on public.sessions(created_at);
create index idx_session_scores_session_id on public.session_scores(session_id);
create index idx_session_scores_criterion_id on public.session_scores(criterion_id);
create index idx_session_messages_session_id on public.session_messages(session_id);
create index idx_session_messages_created_at on public.session_messages(created_at);
create index idx_subscriptions_team_id on public.subscriptions(team_id);
create index idx_subscriptions_stripe_customer_id on public.subscriptions(stripe_customer_id);

-- ===================
-- 4. AUTO-CREATE USER PROFILE ON SIGNUP
-- ===================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  new_team_id uuid;
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', '')
  );

  -- Auto-create a personal team and make user the admin
  insert into public.teams (name, owner_id)
  values (coalesce(new.raw_user_meta_data ->> 'full_name', new.email) || '''s Team', new.id)
  returning id into new_team_id;

  insert into public.team_members (team_id, user_id, role)
  values (new_team_id, new.id, 'admin');

  -- Create a free subscription for the team
  insert into public.subscriptions (team_id, plan, status, framework_slots)
  values (new_team_id, 'base', 'active', 1);

  return new;
end;
$$;

-- Trigger on auth.users insert
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
