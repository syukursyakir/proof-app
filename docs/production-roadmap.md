# Proof — The 20-Phase Plan to Production

> Research-backed roadmap from the current hackathon MVP to a valid, fair, defensible, production-grade hiring product. Each phase has: **Goal · Why (with research) · Build · Failure modes & handling · Employer UX / Candidate UX · Done when.**
> Sources are summarized in §Appendix. This is engineering/product guidance, **not legal advice** — engage employment counsel + an I-O psychologist before relying on the assessment in real hiring.

---

## 0. Where we are (verified 2026-06-23)

**Working, live** (`proof-app-virid.vercel.app`): voice role authoring (Whisper+GPT), ElevenLabs voice interview with recording + transcript, glass-box verdict (per-criterion score + verbatim quote), Google login gating `/roles`, seeded Customer Support demo. QA pass: all routes respond, `/roles` → login redirect, APIs return clean 400s on bad input, live rubric generation works.

### 🔴 Critical findings from the audit (the real gaps)
These are **fine for the hackathon demo** (single user, throwaway data) but are **hard blockers before any real customer**:
1. **No multi-tenancy — cross-tenant data leak.** `roles` has no owner/org. `/api/roles` returns *every* employer's roles to *any* logged-in user. (P1)
2. **All write APIs use the service-role key and are unauthenticated** — they bypass RLS entirely; `/api/seed` is an open GET that writes rows. (P1)
3. **Recordings live in a public bucket**, served by `getPublicUrl` — every interview A/V is world-readable. (P2)
4. **Transcript is assembled in the browser and POSTed unauthenticated** — a candidate can submit arbitrary text that's fed straight to the scoring LLM (injection + score tampering). (P3, P7)
5. **Scoring runs at temperature 0.4, single sample, no quote verification, no injection defense.** Non-deterministic and spoofable. (P7)

### The north star
Proof is, in selection-science terms, **a structured interview with mechanical, criterion-referenced scoring** — which the latest meta-analysis (Sackett et al. 2022) ranks as the **#1 predictor of job performance (ρ ≈ .42), ahead of cognitive ability.** We are building the right instrument. The entire roadmap exists to make that instrument *valid, reliable, fair, and defensible* — and to wrap it in a real SaaS.

---

## The Assessment Doctrine — "How do we decide a candidate is good?"

This is the heart of the product. The science is unambiguous on the principles:

- **Structure is the whole ballgame.** Validity climbs monotonically with interview structure (Huffcutt & Arthur: r̄ .20 → .57 from unstructured → fully structured). An unstructured AI interview collapses to ρ ≈ .19. So: *identical questions, identical order, each answer scored on anchored scales, scores combined mechanically* — never a vibe. (Campion et al. 1997's 15 components.)
- **Ground every rubric in a job analysis** (O*NET KSAs by occupation) — this is what makes scores content-valid and legally defensible (29 CFR 1607.5).
- **Behavior-description questions** ("tell me about a time you…") out-validate situational ones (.56 vs .45) and hold up on complex roles.
- **BARS, not 1–5 sliders.** Every scale point names an observable behavior; 3–5 mutually-exclusive levels; ≤4 verbal anchors visible; each anchor defined. Vague numeric scales are where halo/leniency/central-tendency bias enters.
- **Treat the AI as a rater needing Frame-of-Reference calibration** (the best-supported debiasing intervention, d≈.50): give it dimension definitions + behavioral examples per level + expert "true scores." Do *not* just list biases to avoid — that backfires.
- **Score each dimension independently, criterion-referenced** (never candidate-vs-candidate) to kill halo + contrast effects; withhold résumé/demographics from scoring.
- **Validate against human SME panels**: target ICC (two-way, absolute agreement) ≥ .75; weighted-κ / Krippendorff's α ≥ .80 on ordinal anchors. Publish the numbers — they *are* the evidence.
- **Set cut scores with a modified-Angoff panel**, not a gut threshold; document it.
- **Monitor adverse impact** (four-fifths rule + significance) continuously.
- **Calibrate expectations:** even best-in-class, this explains ~18% of performance variance. Proof is a strong *signal to rank and screen*, never a deterministic verdict — and a human always decides.

The phases below operationalize every line of this.

---

## The 20 Phases

> Priority tags: **P0** = pre-customer blocker · **P1** = credible launch · **P2** = scale/maturity. (Independent of phase number, which is build order.)

### Phase 1 — Security & tenancy foundation `P0`
- **Goal:** every row is owned by an org; nobody sees another tenant's data.
- **Why:** the cross-tenant leak above is a categorical failure. (Supabase RLS multi-tenant patterns.)
- **Build:** `organizations`, `org_members(user_id, org_id, role)`, `org_id` FK on `roles` (children inherit via `role_id`). Enable RLS on all tables keyed to `auth.uid()`→`org_members`. Route employer reads/writes through the **user-scoped** server client (not the admin key). Add auth checks to every `/api` route. **Lock/remove `/api/seed`.**
- **Failure modes:** RLS lockout (test policies before enforcing); migration on existing rows (backfill an org). 
- **Employer UX:** workspace concept, "your roles" only. **Candidate UX:** unchanged.
- **Done when:** an integration test proves org A cannot read org B's roles/candidates/verdicts.

### Phase 2 — Private media & data lifecycle `P0`
- **Goal:** recordings are private; data has a lifespan.
- **Why:** public A/V of candidates is a privacy/GDPR incident; PDPA/GDPR require retention limits.
- **Build:** flip `recordings` bucket to private; remove anon storage policies; upload via server or scoped token; serve playback via short-lived `createSignedUrl` to authorized org members only. Add `retention_days` per org + a scheduled purge; candidate data-deletion path.
- **Failure modes:** signed-URL expiry mid-playback (regenerate on demand); purge of data under legal hold (exempt flag).
- **Employer UX:** recordings only via the verdict page. **Candidate UX:** "your data is deleted after N days" notice.
- **Done when:** a recording URL is inaccessible without an authorized signed URL; purge job verified.

### Phase 3 — Candidate identity & access `P0`
- **Goal:** secure, friendly candidate entry (your Kahoot/GitHub short-code idea).
- **Why:** bare non-expiring UUID links are shareable/reusable forever; consent must be logged (IL/EU).
- **Build:** separate opaque invite token — store `token_hash`, `expires_at`, `used_at`, `status`; enforce expiry + one-time-start server-side (resume allowed until `completed`). Optional **8-char human code** ("join your interview"). Logged, timestamped recording+AI **consent capture** before start. Bind token to one session; log device/IP as a light anti-impersonation signal.
- **Failure modes:** candidate loses link (resend flow); token reuse attempt (reject + alert); double consent.
- **Employer UX:** "copy invite / send invite," expiry control. **Candidate UX:** type a short code, clear consent screen.
- **Done when:** expired/used tokens are rejected; consent is stored with timestamp.

### Phase 4 — Job analysis & competency foundation `P1`
- **Goal:** rubrics grounded in real job requirements, not vibes.
- **Why:** content validity + legal defensibility require a job analysis (29 CFR 1607.5); O*NET gives empirically-rated KSAs per occupation.
- **Build:** map the spoken role → an O*NET SOC code; pull high-Importance KSAs; seed rubric competencies from them; let the employer confirm/edit. Store the job-analysis provenance with the role.
- **Failure modes:** wrong SOC match (let employer correct); novel roles O*NET lacks (manual competency path).
- **Employer UX:** "we based this on the [Customer Support Rep] occupation — adjust." **Candidate UX:** n/a.
- **Done when:** each rubric criterion traces to a job-analysis source.

### Phase 5 — Structured-interview enforcement `P1`
- **Goal:** make the interview a *real* structured interview by default.
- **Why:** +.37 validity swing from structure (Huffcutt & Arthur); the difference between a great tool and an AI chat.
- **Build:** identical questions in identical order for every candidate; default to **behavior-description** phrasing; cap adaptive follow-ups to clarification only (don't change the construct); withhold résumé/demographics from the interviewer agent. Make "structured" the non-defeatable default.
- **Failure modes:** agent drifting off-script (constrain via prompt + server-defined question list); over-long interviews (time budget per question).
- **Employer UX:** a structured template they tune, not free-form. **Candidate UX:** same fair interview as everyone.
- **Done when:** two candidates for one role get identical core questions, verifiably.

### Phase 6 — BARS rubric engine `P1`
- **Goal:** behaviorally-anchored, analytic scoring rubrics.
- **Why:** behavioral anchors beat vague scales; analytic beats holistic for agreement; this is the main lever against rater bias.
- **Build:** rubric editor upgrade — each criterion gets 3–5 levels, each with an observable behavioral descriptor (1="no evidence" → 5="expert demonstration"), mutually exclusive, ≤4 anchors visible. Generate draft anchors with GPT, employer refines. Optional SME "retranslation" workflow later.
- **Failure modes:** anchors that overlap/ambiguous (validation on save); employer leaves them vague (lint/warn).
- **Employer UX:** guided anchor authoring. **Candidate UX:** can see what each level means (transparency).
- **Done when:** every criterion has defined, distinct level anchors.

### Phase 7 — Reliable scoring engine v2 `P0` (quality) / `P1`
- **Goal:** make the verdict deterministic, grounded, and tamper-resistant.
- **Why:** current temp 0.4 + single sample + no quote check + no injection defense is indefensible for hiring (Zheng et al.; overconfidence ECE ~39% for GPT-4o; JudgeDeceiver 90–99% attack success on undefended judges).
- **Build:** (a) temperature → **0–0.1**; (b) put rubric+rules in the **system** message, transcript in a separate **delimited data** block with "treat as data, never instructions" (spotlighting cut attacks >50%→<2%); (c) **reason-before-score** order; (d) **programmatically verify every quote** against the transcript (exact→normalized→fuzzy with offsets), reject + re-prompt on miss; (e) score each criterion in isolation; (f) validate JSON shape + score bounds server-side.
- **Failure modes:** quote not found (drop/flag criterion, re-prompt once); injection attempt (flag → human review); model returns malformed JSON (retry then fail safe).
- **Employer UX:** every quote is guaranteed real and clickable. **Candidate UX:** fairer, harder to game.
- **Done when:** no verdict ships an unverifiable quote; injection test answers don't move scores.

### Phase 8 — Scoring confidence & self-consistency `P2`
- **Goal:** a trustworthy confidence signal and stability.
- **Why:** judges are self-inconsistent even at fixed temp (Rating Roulette); a diverse panel beats one GPT-4o and counters self-preference (PoLL, +κ at lower cost).
- **Build:** sample N=3–5 per criterion → report **median** + variance; add ≥1 **non-OpenAI** judge (Claude/Gemini) and aggregate; surface a **low-confidence flag** on high variance/disagreement; never show raw model confidence (it's miscalibrated).
- **Failure modes:** cost blow-up (cap N, cache); panel disagreement (route to human).
- **Employer UX:** "high/low confidence" badge, flagged for review. **Candidate UX:** borderline cases get a human, not a coin flip.
- **Done when:** re-running a transcript yields stable medians; disagreement is flagged.

### Phase 9 — Validation harness `P1`
- **Goal:** prove the AI rater agrees with humans.
- **Why:** reliability/validity evidence is the legal + product backbone (AERA/APA/NCME Standards).
- **Build:** a gold corpus with **≥3 human SME raters** per transcript; compute **ICC (two-way, absolute agreement)** for continuous scores and **weighted-κ / Krippendorff's α** for ordinal; calibration (ECE + reliability diagram); test-retest variance. Compare against the human–human agreement ceiling. Publish results.
- **Failure modes:** low agreement on subjective criteria (revise anchors / FOR-calibrate the model); small sample (report CIs, not point estimates).
- **Employer/Candidate UX:** a published "how accurate is Proof" page builds trust.
- **Done when:** ICC ≥ .75 on key criteria, with CIs, documented.

### Phase 10 — Defensible thresholds, ranking & comparison `P1`
- **Goal:** turn scores into decisions employers can defend and use.
- **Why:** arbitrary cutoffs are legally exposed (Angoff is the standard); every competitor has compare/shortlist.
- **Build:** **modified-Angoff** SME workflow to set cut scores (documented borderline definition + per-item probabilities); employer **ranked shortlist + side-by-side comparison**, multi-reviewer notes. Keep "human decides" prominent.
- **Failure modes:** ties/edge scores (show evidence, defer to human); cut score drift (version + date it).
- **Employer UX:** rank, compare, shortlist, comment. **Candidate UX:** consistent bar applied to all.
- **Done when:** thresholds are documented and a compare view exists.

### Phase 11 — Human-in-the-loop & appeal `P0` (compliance)
- **Goal:** no human is rejected by a machine alone; everyone can contest.
- **Why:** GDPR Art 22 forbids solely-automated significant decisions without safeguards; it's also the strongest fairness/ethics stance.
- **Build:** scores never auto-advance/reject; reviewer sign-off required; a candidate **appeal / human-review** request path with documented turnaround.
- **Failure modes:** reviewer rubber-stamping (surface evidence, require a reason); appeal backlog (SLA + queue).
- **Employer UX:** explicit Advance/Reject with reasons. **Candidate UX:** "request a human review" button.
- **Done when:** every decision has a human actor recorded; appeals are trackable.

### Phase 12 — Accessibility & alternative formats `P0` (compliance)
- **Goal:** the assessment doesn't screen out disabled candidates.
- **Why:** ADA "screen out"; ASR is ~2× worse for some accents/speech (Koecke et al.) — a real bias + legal vector. **Never** infer emotion/affect (EU-banned, discredited).
- **Build:** captioning + transcript display, screen-reader-compatible UI, extended/again options, a **text/written alternative** interview, and an **accommodation request** mechanism. Score content only, never voice quality/accent/affect.
- **Failure modes:** ASR mistranscription harming scores (let candidate review/correct transcript; score on corrected text); unsupported AT (text fallback always available).
- **Candidate UX:** choose format, request accommodations, review transcript. **Employer UX:** sees accommodation was honored, not the disability.
- **Done when:** a candidate can complete a fully text-based, screen-reader-friendly interview.

### Phase 13 — Candidate experience polish `P1`
- **Goal:** a calm, fair, professional candidate journey.
- **Why:** async AI interviews drive anxiety/distrust; experience affects completion + employer brand.
- **Build:** pre-flight mic/cam check, clear "what's assessed" preview, save/resume, progress + time cues, post-interview status, optional feedback, plus the fairness/consistency messaging Proof is built on.
- **Failure modes:** device failures (graceful fallbacks), dropouts (resume).
- **Candidate UX:** the whole point. **Employer UX:** higher completion rates.
- **Done when:** the candidate flow has a tech check + resume + status.

### Phase 14 — Reliability & resilience `P1`
- **Goal:** an interview is never silently lost; transient errors self-heal.
- **Why:** current transcript write is fire-and-forget; no retry/backoff/idempotency; scoring bound to the 60s function limit.
- **Build:** capture transcript **server-side** (ElevenLabs post-call webhook) as source of truth, not the browser; retries w/ exponential backoff on 429/5xx/timeout; idempotency keys; move scoring to a **background job/queue**; durable transcript write with explicit retry UI; graceful degradation everywhere (mic denied, API down).
- **Failure modes:** webhook missed (reconcile job); duplicate scoring (idempotency).
- **Both UX:** "saving… / saved / retry," never a white screen.
- **Done when:** killing the network mid-interview still recovers the transcript + verdict.

### Phase 15 — Observability & security ops `P1`
- **Goal:** see failures, stop abuse.
- **Why:** unauthenticated AI endpoints are a denial-of-wallet target; no monitoring today.
- **Build:** Sentry (errors+tracing), structured logs with request IDs, **rate limiting** (Upstash) on generate/transcribe/score/signed-URL, secret hygiene, input/output anomaly detection for prompt-injection.
- **Failure modes:** rate-limit false positives (per-org quotas), alert fatigue (tune).
- **Done when:** errors are alerting and public AI endpoints are rate-limited.

### Phase 16 — Testing & CI `P1`
- **Goal:** ship without breaking tenancy or scoring.
- **Build:** unit (rubric/score JSON validation, token expiry, quote verifier), integration (API routes on a test Supabase, **explicit cross-org RLS isolation tests**), E2E **Playwright** (employer authoring + candidate interview, mocked AI), GitHub Actions gating deploys (lint+typecheck+test).
- **Failure modes:** flaky AI mocks (deterministic fixtures).
- **Done when:** CI is green-gated and a tenancy-isolation test exists.

### Phase 17 — Bias monitoring & audit `P0` (compliance, if US/NYC)
- **Goal:** detect and document adverse impact.
- **Why:** Title VII four-fifths rule; NYC Local Law 144 requires an **independent annual bias audit** + public posting + candidate notice for AEDTs.
- **Build:** per-employer adverse-impact dashboard (selection/scoring rates + impact ratio by sex, race/ethnicity, intersectional) with significance testing; alerts under 0.80; pipeline to an independent auditor; LL144 candidate notice (≥10 business days) + public audit summary; proxy-variable detection.
- **Failure modes:** missing demographic data (voluntary self-ID, never inferred); small samples (report, don't over-interpret).
- **Done when:** impact ratios compute and an LL144-ready report can be produced.

### Phase 18 — Privacy & legal compliance `P0/P1`
- **Goal:** defensible under PDPA, GDPR, and EU AI Act.
- **Build:** full layered consent flow (recording + AI-scoring disclosure, purposes, retention, rights, withdrawal, human-review, transfer, DPO contact); GDPR **DPIA**; data-subject rights workflows (access/rectify/erase/port); EU AI Act **provider** docs (risk mgmt Art 9, data governance Art 10, technical docs Art 11, logging Art 12, transparency Art 13, human oversight Art 14) and Art 86 per-candidate explanation; Illinois/Maryland specifics; SCCs for EU→SG transfer. **No emotion inference, ever.**
- **Failure modes:** consent withdrawn mid-process (stop + delete); cross-border without SCCs (block).
- **Done when:** a candidate can exercise every right; provider docs exist.

### Phase 19 — SaaS platform `P2`
- **Goal:** a product teams can buy and run.
- **Build:** team roles/permissions + org invites; SSO (SAML/OIDC) roadmap; transactional email/notifications (**Resend**: invite/reminder/complete/verdict-ready); custom branding for the candidate page; **Stripe** billing (per-interview metering fits the per-use AI cost); product analytics (funnel: invite→started→completed→verdict→hire).
- **Failure modes:** email deliverability (warm domain, SPF/DKIM); billing edge cases (proration).
- **Done when:** an employer can invite a teammate, get billed, and receive notifications.

### Phase 20 — Scale, cost & go-to-market `P2`
- **Goal:** sustainable unit economics + distribution.
- **Build:** model tiering (gpt-4o-mini for follow-ups, larger only for final verdict; cache rubric gen); per-interview unit-economics model (ElevenLabs per-min + Whisper + tokens) before pricing; **ATS integration** via Merge.dev (Greenhouse/Lever/Ashby — build on Greenhouse v3, v1/v2 sunset Aug 2026); SOC 2 Type II path; performance hardening (background workers, caching); pricing + GTM motion (the Theme-B wedge: affordable, explainable, small-employer-first).
- **Failure modes:** cost > price (meter + cap); ATS API changes (Merge abstracts).
- **Done when:** gross margin per interview is positive and one ATS connector works.

---

## Sequencing recommendation
- **For the hackathon (now):** ship the MVP as-is. The audit gaps are acceptable for a single-user demo and fixing them now risks the working demo. Mention "production hardening roadmap" on a slide — it's a *strength* (shows you understand validity + compliance).
- **First real customers (P0 block):** Phases **1, 2, 3, 7, 11, 12, 17, 18** — security, privacy, human-in-loop, accessibility, bias, compliance. These are non-negotiable before a real candidate is judged.
- **Credible product (P1):** Phases **4, 5, 6, 9, 10, 13, 14, 15, 16**.
- **Scale (P2):** Phases **8, 19, 20**.

## Compliance one-pager (MVP vs full)
- **MVP-to-launch:** no emotion inference · human-in-the-loop · accessible alternative · layered consent + retention/deletion · candidate notice + appeal · basic adverse-impact tracking.
- **Full production:** independent bias audit (LL144) + public posting · GDPR DPIA + SCCs · EU AI Act provider conformity + CE/registration · DPO/EU rep · SOC 2 · ISO 42001 (differentiator).

## Appendix — key sources
Selection validity: Schmidt & Hunter 1998; Sackett et al. 2022 (struct. interview ρ=.42, #1); Huffcutt & Arthur 1994 (structure +.37); Campion et al. 1997 (15 components); Taylor & Small 2002 (BDI .56). Rubrics/bias: Smith & Kendall 1963 (BARS); Woehr & Huffcutt 1994 / Roch et al. 2012 (FOR training d≈.50). Reliability: Koo & Li 2016 (ICC); Landis & Koch 1977 (κ). Cut scores: modified Angoff; AERA/APA/NCME Standards; 29 CFR 1607. LLM-judge: Zheng et al. (MT-Bench); G-Eval; PoLL "juries"; overconfidence ECE study; JudgeDeceiver; Microsoft spotlighting; OWASP LLM01. Compliance: EU AI Act Annex III/Art 5,14,26,86; NYC Local Law 144; EEOC 2023 TA + 2022 ADA guidance; Singapore PDPA + PDPC AI Guidelines; GDPR Art 22; Koenecke et al. 2020 (ASR bias); Barrett et al. 2019 (affect). Production: Supabase RLS multi-tenancy; Resend; Sentry; Upstash; Merge.dev; Playwright.
