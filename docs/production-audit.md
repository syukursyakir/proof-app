# Production-readiness audit — Clarion

Full code audit + production-standards research (test integrity, EEOC/ADA, NYC
LL144, EU AI Act, GDPR/PDPA, WCAG 2.1 AA). This logs every finding, what's fixed,
and what's a deliberate post-hackathon call. Payments/billing out of scope.

---

## ✅ Fixed (shipped)

### Aptitude test (the priority)
- **Server-authoritative timer + autosave/resume.** The countdown is now anchored
  to a server timestamp (`aptitude_started_at`), so a mid-test refresh shows the
  REAL remaining time (can't reset for more time) and restores autosaved answers.
  Defensive: any failure falls back to the local timer so the test always runs.
  (`/api/aptitude-state`, migration 013)
- **One attempt — no retakes.** `test-submit` only writes when `aptitude_score`
  is still null; a refresh-and-retake or double-submit can't overwrite the first
  result. Same for `skills-submit` (and it returns before calling GPT if already
  scored).
- **Auto-submit no longer loses answers.** The timer's auto-submit used a stale
  React closure that captured start-of-test answers — on timeout it silently
  dropped most answers + all proctoring flags. Now routed through a live ref.
- **Answer key never reaches the candidate** (`correct` stripped server-side).
- **Honest proctoring badge** — "Screen recording — proctored" only shows if
  recording actually started.
- **Screen-reader time warnings** — 5-min / 1-min announcements via an aria-live
  region.
- **Tab-switch + screen-share-drop flags** surfaced on the verdict for human
  review (never auto-fail).

### Scoring / verdict
- **Auto-scoring on completion** — interviews now score themselves server-side
  the moment the candidate finishes, so the employer sees the /100 verdict
  immediately on the Kanban (no manual "Generate verdict" step).
- **Empty-transcript guard** — won't score an interview with <80 chars of
  candidate speech or no rubric (was fabricating ungrounded scores).
- **Empty interview doesn't lock the candidate out** — `/api/transcripts` only
  marks "completed" if the candidate actually spoke; otherwise they can retry.
- **Verdict write is atomic-ish** — new verdict inserted before old ones are
  deleted (never leaves a candidate with no verdict).
- **Composite can't exceed 100** — each skills per-question score clamped to
  [0,5].
- **No emotion/affect scoring** — scorer explicitly told to judge only content
  and reasoning, never emotion, accent, gender, age, or demeanour (EU AI Act).

### Security / data
- **Defense-in-depth auth** — `candidates` & `roles` GET routes now require
  `getUserOrgId()` instead of trusting RLS alone.
- **Recordings bucket verified private** (`public = false`); playback via
  short-lived signed URLs only.
- **Whisper spend bounded** on the open self-join path — candidate audio capped
  at 15 MB.
- **join_code collision retry** so a rare unique clash doesn't dead-end a
  candidate.
- All candidate routes token-gated; all employer/OpenAI routes org-gated.

---

## 🟡 Deferred — deliberate post-hackathon calls

These are real but either declined, need infra, or are lower-severity. Listed so
they're not forgotten.

- **Rate limiting** (declined — Upstash). The open role code lets anyone with it
  self-register candidates; idempotency + the 15 MB cap blunt the worst GPT/
  Whisper spend, but a true per-IP/per-role rate limit is the real fix. **Highest
  remaining priority for a paid launch.**
- **Item banking** — everyone with a role sees the same generated items;
  production wants a pool of N drawn per candidate + per-candidate option
  randomisation, so leaked items don't compromise the test.
- **Data retention / deletion policy** — define a window (e.g. 90–180 days) with
  automated deletion of recordings/transcripts, plus candidate data export/erasure
  (GDPR/PDPA rights).
- **Migration runner** — migrations are hand-run SQL; production needs an enforced
  order (CI / `supabase db push`) so a fresh env can't end up with the recordings
  bucket public (the 001-vs-003 ordering risk).
- **Accommodations** — an extra-time / alternative-format request path that does
  NOT visibly flag the result (ADA). A text interview alternative already exists.
- **Upload-failure UX** — recording/transcript uploads are best-effort; surface
  failures + retry before marking complete, so a failed upload never silently
  loses data.
- **Rubric coaching leak** — the rubric `good`/`bad` descriptors reach the
  candidate's browser (partly intentional transparency); for stricter integrity,
  send only criterion names and build the agent prompt server-side.
- **Full WCAG 2.1 AA pass** — keyboard nav + focus + contrast are mostly there
  and time warnings are announced; a complete audit (screen-reader labels on every
  control, captions for the interview) remains.
- **Email notifications** (declined — Resend) — candidates currently check their
  status page; employers check the dashboard.

---

## Compliance posture (for the deck)
Clarion is built to the right side of the major regimes: **AI assesses, a human
decides** (every flag is reviewable, never auto-reject); **no emotion inference**
(EU AI Act); **consent + privacy** stated before recording, recordings private to
the employer, "never sold/shared/used to train AI"; **candidate transparency**
(what they're assessed on, that a human decides, an appeal path). Formal
bias-audit + validation studies are a real-usage, post-launch step.
