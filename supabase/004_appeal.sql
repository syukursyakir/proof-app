-- Proof migration 004 — candidate appeal / human-review request (GDPR Art 22 safeguard).
alter table candidates add column if not exists appeal_requested_at timestamptz;
