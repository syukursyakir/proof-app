-- Optional candidate resume upload, attached as CONTEXT for the human employer.
-- The AI never SCORES the resume — assessment stays ability-based (B5 thesis +
-- legal defensibility). Employer decides per role whether to ask for it.
--
-- The resume MAY personalise the interview: we extract verifiable "claims" and
-- the AI interviewer asks the candidate to substantiate them live. Scoring still
-- only sees the transcript, judged against the same rubric for everyone.

-- 'off' | 'optional' | 'required'
alter table roles
  add column if not exists resume_mode text not null default 'optional';

-- Private storage path (in the existing 'recordings' bucket), not a public URL.
alter table candidates
  add column if not exists resume_url text;

-- Verifiable claims extracted from the resume, for interview probes only.
alter table candidates
  add column if not exists resume_claims jsonb;
