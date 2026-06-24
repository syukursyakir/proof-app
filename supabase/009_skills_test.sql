-- Migration 009: written skills work-sample
-- Stores the candidate's typed answers to the open-ended skills questions and
-- the LLM score against the role rubric.

ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS skills_score   numeric(5,1) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS skills_max     integer       DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS skills_answers jsonb         DEFAULT NULL;
