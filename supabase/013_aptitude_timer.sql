-- Migration 013: server-authoritative aptitude timer + autosave
-- Anchors the countdown to a server timestamp so a refresh can't reset it, and
-- lets answers autosave so a refresh/crash doesn't lose progress.

ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS aptitude_started_at timestamptz DEFAULT NULL;
