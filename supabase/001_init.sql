-- Proof — initial schema. Run in the Supabase SQL editor.
-- Demo posture: RLS left permissive for speed (hackathon). Tighten post-event.

create extension if not exists "uuid-ossp";

create table if not exists roles (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description_raw text,
  rubric jsonb,                 -- [{name, good, bad}]
  test_questions jsonb,         -- [string]
  interview_questions jsonb,    -- [string]
  test_enabled boolean default true,
  created_at timestamptz default now()
);

create table if not exists candidates (
  id uuid primary key default uuid_generate_v4(),
  role_id uuid references roles(id) on delete cascade,
  name text,
  status text default 'invited',   -- invited | interviewing | completed | advanced | rejected
  created_at timestamptz default now()
);

create table if not exists transcripts (
  id uuid primary key default uuid_generate_v4(),
  candidate_id uuid references candidates(id) on delete cascade,
  full_text text,
  turns jsonb,                  -- [{role:'agent'|'user', text, t}]
  recording_url text,
  created_at timestamptz default now()
);

create table if not exists verdicts (
  id uuid primary key default uuid_generate_v4(),
  candidate_id uuid references candidates(id) on delete cascade,
  overall jsonb,                -- {summary, recommendation}
  per_criterion jsonb,         -- [{name, score, justification, quotes:[string]}]
  created_at timestamptz default now()
);

-- Storage bucket for A/V recordings (created here so no manual step needed).
insert into storage.buckets (id, name, public) values ('recordings','recordings', true)
  on conflict (id) do nothing;

-- Demo-only: let the browser (anon) upload + read recordings. Tighten post-hackathon.
drop policy if exists "recordings anon read" on storage.objects;
create policy "recordings anon read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'recordings');

drop policy if exists "recordings anon write" on storage.objects;
create policy "recordings anon write" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'recordings');
