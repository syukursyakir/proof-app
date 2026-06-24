-- Migration 008: aptitude test proctoring
-- Stores the screen recording captured during Part 1 (the timed aptitude test).

ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS proctor_recording_url text DEFAULT NULL;
