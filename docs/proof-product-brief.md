# Proof — Product Brief (the build spec)

> NOTE: `project.md` in this folder is the HACKATHON brief (TheFirst Spark Challenge, by Wavesparks + January Capital, due 25 June 12:00pm SGT). THIS file is the product/build spec for Proof.

## What we're building
Proof — an employer-owned candidate assessment platform. An employer describes their ideal hire by voice, AI generates a role-specific assessment (optional skills test + a live AI voice interview), candidates complete it, and the employer gets a transparent verdict where every AI judgment links to the exact transcript evidence. Human makes the final call.

## Stack (do not deviate)
- Next.js (App Router) + TypeScript + Tailwind
- Supabase (Postgres, Auth, Storage)
- Vercel (deploy from day one)
- ElevenLabs Conversational AI (the interview voice)
- OpenAI API (rubric generation, adaptive follow-ups, scoring, Whisper)

## Hard constraints
- Solo dev, ~2 days. Working end-to-end demo over completeness.
- Every phase ends deployable and clickable.
- Secrets in env vars only.
- Keep components small. No premature abstraction.

## Demo target
One seeded role: **Customer Support**. Full happy path flawless for this one role.

## Phases
- **Phase 0 — Skeleton + deploy.** Next.js+TS+Tailwind, Supabase schema (roles, candidates, transcripts, verdicts + `recordings` storage bucket), app shell (nav, employer Roles page, `/interview/[candidateId]`). Deploy to Vercel.
- **Phase 1 — Voice authoring -> assessment generation.** Employer records spoken role description (MediaRecorder + Whisper). OpenAI asks 1-2 follow-ups, then returns JSON: rubric (name + good/bad), 3 test questions, 5 interview questions. Editable form, save to `roles`.
- **Phase 2 — Candidate interview.** `/interview/[candidateId]`, Zoom layout (webcam tile + center voice orb). ElevenLabs conducts interview, one adaptive follow-up per answer, answers candidate questions from rubric. Orb = canvas driven by audio amplitude. Record A/V to `recordings`, transcript to `transcripts`.
- **Phase 3 — Glass-box verdict.** Transcript + rubric -> OpenAI -> JSON: overall + per-criterion score + justification + exact transcript quote(s). Employer dashboard: scores expand to highlighted transcript evidence, raw transcript + A/V players, manual Advance/Reject.
- **Phase 4 — Demo hardening.** Seed Customer Support fully. Scripted reliable candidate path. Graceful failures (mic denied, API timeout). Polish the three on-camera moments.

## Working notes
- Build per phase, confirm it runs, commit, move on. Report what broke.
- OpenAI: JSON-only, validate, retry once on parse failure.
- No auth/billing/templates/settings unless a phase needs it.
