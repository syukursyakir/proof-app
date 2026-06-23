-- Proof migration 006 — human ratings for AI-vs-human validation (harness for P9).
create table if not exists human_ratings (
  id uuid primary key default uuid_generate_v4(),
  candidate_id uuid references candidates(id) on delete cascade,
  org_id uuid references organizations(id) on delete cascade,
  rater_user_id uuid references auth.users(id),
  per_criterion jsonb,   -- [{name, score}]
  created_at timestamptz default now()
);

alter table human_ratings enable row level security;
drop policy if exists hr_all on human_ratings;
create policy hr_all on human_ratings for all
  using (org_id in (select org_id from org_members where user_id = auth.uid()))
  with check (org_id in (select org_id from org_members where user_id = auth.uid()));
