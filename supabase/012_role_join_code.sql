-- Migration 012: open per-role join code (Kahoot-style)
-- One code per role; any candidate can self-join, no pre-registration.

ALTER TABLE roles
  ADD COLUMN IF NOT EXISTS join_code text DEFAULT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS roles_join_code_key
  ON roles (join_code)
  WHERE join_code IS NOT NULL;
