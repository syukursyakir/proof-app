# Clarion — 3-Minute Demo Video Script (≤3:00, YouTube)

> Structure: hook → full live walkthrough (build a role with the click-based picker → review screen → join code → candidate side → interview → verdict → multilingual proof) → close. Screen-record at 1080p; talk over it. Every beat below is tight — rehearse it once before recording so the pacing feels natural, not rushed.

---

## 0:00 – 0:38 · Hook
*(On camera, direct to lens — not voiceover. This lands harder spoken to the viewer.)*
> "Ever been rejected from a job — even though you knew, deep down, you could
> actually do it?
>
> Turns out, you're not alone. We surveyed 21 people — students, working
> adults, job seekers — and **76% said exactly that: they felt they could've
> done the job well, but never got the chance to prove it.** And when we asked
> what actually hurt their applications, it wasn't their skills — **81% pointed
> to their school, their work experience, their background** instead.
>
> **71% told us they'd rather be judged on what they can actually do, than on
> a resume alone.**
>
> So we built a different way to prove it. This is **Clarion** — hire on
> proof, not pedigree."

## 0:38 – 0:42 · Transition into the product
*(Screen: clarion.fyi landing page → click "For Employers")*
> "Don't believe me? Let me show you."

## 0:42 – 0:55 · New role — language comes first
*(Screen: click "+ New role" → the language step, all 11 options visible)*
> "What language should this run in? Most hiring tools only work in English —
> we didn't think that was fair. Every assessment runs in the candidate's own
> language. I'll pick English for now."
*(Click English → Next.)*

## 0:55 – 1:00 · Pick the role
*(Screen: RolePicker — click "Software" category, then "Software Engineer")*
> "Pick a category, then the exact role. No long form."

## 1:00 – 1:04 · Pick the skills
*(Screen: skill chips — click version control, debugging, API design)*
> "Tap the skills that actually matter for this job."

## 1:04 – 1:13 · OpenAI builds the assessment
*(Screen: click "Build the assessment" → building animation)*
> "OpenAI takes that and builds the whole thing — rubric, aptitude questions,
> work-sample, interview questions — all mapped to what I just picked."

## 1:13 – 1:26 · The review screen — nothing goes out unreviewed
*(Screen: Review & Edit — scroll through rubric, MCQ with difficulty check, skills work-sample, interview questions)*
> "Less than two minutes, and I've got a full interview plan. The rubric's
> mine to edit, I can check question difficulty, swap anything I don't like —
> nothing goes to a candidate I haven't reviewed myself."

## 1:26 – 1:39 · Glossary + resume
*(Screen: scroll to Glossary section, then the Resume toggle)*
> "There's a glossary too, so the AI doesn't mishear our own technical jargon
> mid-interview. And resume collection's optional — we score skill, not paper.
> I'll switch it to required, just for this demo."

## 1:39 – 1:48 · Save → join code
*(Screen: Save → Roles page → join code badge)*
> "Save it, and I've got a join code — same idea as Kahoot. No portal, no
> account. Just a code anyone can use."

## 1:48 – 1:56 · Candidate joins
*(Screen: /join → paste code → name → assessment intro screen showing 3 parts)*
> "Candidate pastes the code, types their name, and they're in. Three parts:
> a resume upload, a timed aptitude screen, then the interview."

## 1:56 – 2:21 · THE interview (still the hero — protect this time)
*(Screen: /interview/[token]. Orb + webcam. Consent line visible.)*
> "Now the candidate joins one voice interview — the same fair conversation
> every applicant gets. It's not reading a script — it follows up on what
> they actually say."
*(Show an adaptive follow-up: "You said you stayed on the line — what was going through your mind?")*
> "And the candidate can ask it anything back, even —"
*(Candidate:)* "How am I being judged here?"
*(Agent answers honestly from the rubric.)*
> "It tells them straight. Transparent to both sides, in real time."

## 2:21 – 2:46 · The glass-box verdict
*(Screen: employer verdict view.)*
> "Then the employer gets a verdict, scored against their own rubric — and
> every score is glass-box."
*(Click a criterion; it expands; the transcript quote highlights.)*
> "Empathy: four out of five — here's the exact moment that earned it,
> highlighted in the transcript. No black box. Most AI hiring tools just hand
> you a number — some are getting sued for it. Clarion shows its receipts —
> and the human still makes the call."

## 2:46 – 2:57 · Proof it's not just for English
*(Screen: switch this same role's language to Chinese → candidate's aptitude
test + interview screen now fully in Chinese)*
> "And because this runs on ElevenLabs' full voice library, not just one —
> watch what happens if I switch this role to Chinese."
*(Hold on the Chinese screens for 4-5s.)*
> "Same product, any language. That's not a bolted-on translation — it's
> built in from the start."

## 2:57 – 3:00 · Close
> "**Clarion. Hear the proof, not the pedigree.**"
*(End card: logo + live link.)*

---

### Production notes
- **Use two different roles, not one.** Pre-seed "Customer Support" with a
  finished candidate + verdict (via `/api/seed`) for the interview + verdict
  beats — you need real transcript/quote data there, which only exists after
  a real interview has happened. Build the *new* "Software Engineer" role
  live, on camera, for the creation walkthrough (language → picker → skills →
  build → review → save → join code). Don't try to build a role live and
  show its finished verdict in the same take — there's no interview data for
  it yet.
- For the Chinese-language proof at 2:46, switch the **already-seeded**
  Customer Support role's language (via its edit page), not the new one you
  just built — faster, and you already know its candidate flow works.
- Pre-fill the join flow (have the code ready, or a second browser tab
  pre-loaded to `/join`) so you're not waiting on typing during the recording.
- Subtitles on (judges may watch muted).
- **This script is tight — every beat above is one breath, one sentence.**
  Rehearse it once at speed before recording; if anything still runs long,
  cut from the Glossary+Resume beat (1:26) first, then the Save→join-code
  beat (1:39) — those are the two least differentiated steps. Do **not** cut
  the hook, the interview, the verdict, or the Chinese-language proof — those
  four carry the rubric weight (Evidence of Demand, AI Leverage, Originality).
- Total hard cap 3:00 (Devpost rule). The hook carries your real survey data
  (76% / 81% / 71%, from `Survey For Hackathon.csv`, n=21 — Evidence of Real
  Demand, 15% of score) — exact math: 76% = "felt they could've done a job
  well but never got the chance" (16/21); 81% = picked a non-skill reason
  (work experience/academic scores/school name/contacts/background) over
  "skills for the job" when asked what hurts applications most (17/21); 71%
  = prefer skill-based over resume-only hiring (15/21).
- Say "OpenAI" and "ElevenLabs" out loud, on camera, when you actually use
  them (1:04 and 2:46) — judges are explicitly scoring real API integration,
  not just narrating a feature list.
