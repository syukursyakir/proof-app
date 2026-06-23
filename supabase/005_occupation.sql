-- Clarion migration 005 — store the O*NET occupation a role's rubric is grounded in
-- (content-validity / job-analysis provenance).
alter table roles add column if not exists occupation jsonb;
