-- Migration 010: aptitude proctoring integrity signals
-- Stores tab-switch count and screen-share-interruption flag from Part 1.

ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS proctor_flags jsonb DEFAULT NULL;
