-- Proof migration 002 — multi-tenancy + Row Level Security.
-- Run AFTER 001_init.sql. Fixes the cross-tenant data leak: employer data is
-- now scoped to an organization, enforced by RLS. Candidate-facing flows run
-- via the service-role key (which bypasses RLS) gated by app logic.

-- 1) Organizations + membership
create table if not exists organizations (
  id uuid primary key default uuid_generate_v4(),
  name text,
  created_at timestamptz default now()
);

create table if not exists org_members (
  org_id uuid references organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text default 'owner',
  created_at timestamptz default now(),
  primary key (org_id, user_id)
);

-- 2) Tenancy columns on existing tables
alter table roles       add column if not exists org_id uuid references organizations(id) on delete cascade;
alter table candidates  add column if not exists org_id uuid references organizations(id) on delete cascade;
alter table transcripts add column if not exists org_id uuid references organizations(id) on delete cascade;
alter table verdicts    add column if not exists org_id uuid references organizations(id) on delete cascade;

-- 3) Enable RLS
alter table organizations enable row level security;
alter table org_members   enable row level security;
alter table roles         enable row level security;
alter table candidates    enable row level security;
alter table transcripts   enable row level security;
alter table verdicts      enable row level security;

-- 4) Policies (authenticated employer client). Service role bypasses these.
drop policy if exists om_select on org_members;
create policy om_select on org_members for select using (user_id = auth.uid());

drop policy if exists org_select on organizations;
create policy org_select on organizations for select
  using (id in (select org_id from org_members where user_id = auth.uid()));

drop policy if exists roles_all on roles;
create policy roles_all on roles for all
  using (org_id in (select org_id from org_members where user_id = auth.uid()))
  with check (org_id in (select org_id from org_members where user_id = auth.uid()));

drop policy if exists cand_all on candidates;
create policy cand_all on candidates for all
  using (org_id in (select org_id from org_members where user_id = auth.uid()))
  with check (org_id in (select org_id from org_members where user_id = auth.uid()));

drop policy if exists tr_all on transcripts;
create policy tr_all on transcripts for all
  using (org_id in (select org_id from org_members where user_id = auth.uid()))
  with check (org_id in (select org_id from org_members where user_id = auth.uid()));

drop policy if exists ver_all on verdicts;
create policy ver_all on verdicts for all
  using (org_id in (select org_id from org_members where user_id = auth.uid()))
  with check (org_id in (select org_id from org_members where user_id = auth.uid()));
