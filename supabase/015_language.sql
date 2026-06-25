-- Add language preference to roles (the language candidates see during assessment).
-- Defaults to English so all existing roles are unaffected.
alter table roles add column if not exists language text not null default 'en';
