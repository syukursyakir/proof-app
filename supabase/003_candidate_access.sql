-- Clarion migration 003 — secure candidate access + private recordings.
-- Run AFTER 002. Replaces the bare-UUID interview link with an opaque,
-- expiring access token + a short human join code, logs consent, and makes
-- the recordings bucket PRIVATE (served via signed URLs only).

alter table candidates add column if not exists access_token text;
alter table candidates add column if not exists join_code text;
alter table candidates add column if not exists token_expires_at timestamptz;
alter table candidates add column if not exists consent_at timestamptz;
alter table candidates add column if not exists interview_started_at timestamptz;

create unique index if not exists candidates_access_token_idx on candidates(access_token);
create unique index if not exists candidates_join_code_idx on candidates(join_code);

-- Private recordings: remove public read + anon policies; access via signed URLs.
update storage.buckets set public = false where id = 'recordings';
drop policy if exists "recordings anon read" on storage.objects;
drop policy if exists "recordings anon write" on storage.objects;
