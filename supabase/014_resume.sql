-- Optional candidate resume upload, attached as CONTEXT for the human employer.
-- The AI never scores the resume — assessment stays ability-based (B5 thesis +
-- legal defensibility). Employer decides per role whether to ask for it.

-- 'off' | 'optional' | 'required'
alter table roles
  add column if not exists resume_mode text not null default 'optional';

-- Private storage path (in the existing 'recordings' bucket), not a public URL.
alter table candidates
  add column if not exists resume_url text;
