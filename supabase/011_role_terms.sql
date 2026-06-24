-- Migration 011: role glossary
-- Terms/jargon/proper-nouns that prime the AI interviewer to recognise speech-
-- to-text mishearings (e.g. "cloud code" -> "Claude Code").

ALTER TABLE roles
  ADD COLUMN IF NOT EXISTS terms jsonb DEFAULT NULL;
