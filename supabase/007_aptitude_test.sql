-- Migration 007: aptitude test MCQ support
-- Adds structured MCQ questions to roles and aptitude score to candidates.

-- Roles: store generated MCQ questions as JSONB (separate from freeform test_questions)
ALTER TABLE roles
  ADD COLUMN IF NOT EXISTS test_mcq jsonb DEFAULT NULL;

-- Candidates: store aptitude score and per-question answers
ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS aptitude_score numeric(4,1) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS aptitude_max   integer       DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS aptitude_answers jsonb        DEFAULT NULL;
