# Proof — Build Plan (handoff to the developer AI)

> CEO-authored execution plan. Goal: WIN the ElevenLabs "Best Project" bonus + make top-10 stage at TheFirst Spark. Deadline: 25 Jun 2026, 12:00pm SGT. Hero = the ElevenLabs voice interview. Build fast, keep each phase deployable.

---

## 0. Architecture decision (locked)
- **Frontend + backend:** Next.js (App Router) + TypeScript + Tailwind, all on **Vercel**. Backend = Next.js **API routes** (serverless). No separate server.
- **Database / Auth / Storage:** **Supabase** (Postgres + Storage bucket `recordings`).
- **Voice interview:** **ElevenLabs Conversational AI** (browser SDK + a server route to mint signed URLs).
- **AI:** **OpenAI** — Whisper (transcribe employer voice), GPT (rubric gen, scoring).
- **NO Railway.** Everything fits Vercel serverless + Supabase. Do not add it.
- **Auth:** SKIP real auth for the demo. Employer pages are open; use a hardcoded/dummy employer. Candidate accessed by URL `/interview/[candidateId]`. (Supabase Auth is available but not on the critical path — do not build login flows.)

## 1. Repo + deploy setup (do this FIRST — Phase 0)
```bash
# from the project root (which already has the .md briefs)
npx create-next-app@latest . --ts --tailwind --app --eslint --src-dir --import-alias "@/*"
# if it refuses due to existing files, scaffold in ./app-temp and move files up, or move the .md files into /docs first

npm i @supabase/supabase-js @elevenlabs/react openai
git init && git add -A && git commit -m "Phase 0: Next.js skeleton"
```
Then (user does the auth-gated steps):
1. Create a **GitHub repo**, `git remote add origin … && git push -u origin main`.
2. Import the repo on **Vercel** → deploy. Confirm the live URL renders.
3. Create a **Supabase project**; copy URL + anon key + service-role key.
4. Add **env vars** in Vercel (and `.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # server-only, never NEXT_PUBLIC
OPENAI_API_KEY=
ELEVENLABS_API_KEY=
ELEVENLABS_AGENT_ID=              # created in ElevenLabs dashboard
NEXT_PUBLIC_BASE_URL=
```
Add `.env.local` to `.gitignore`. Commit a `.env.example` with the keys blank.

## 2. Supabase schema (run in SQL editor)
```sql
create extension if not exists "uuid-ossp";

create table roles (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description_raw text,
  rubric jsonb,                 -- [{name, good, bad}]
  test_questions jsonb,         -- [string]
  interview_questions jsonb,    -- [string]
  test_enabled boolean default true,
  created_at timestamptz default now()
);

create table candidates (
  id uuid primary key default uuid_generate_v4(),
  role_id uuid references roles(id) on delete cascade,
  name text,
  status text default 'invited',   -- invited | interviewing | completed | advanced | rejected
  created_at timestamptz default now()
);

create table transcripts (
  id uuid primary key default uuid_generate_v4(),
  candidate_id uuid references candidates(id) on delete cascade,
  full_text text,
  turns jsonb,                  -- [{role:'agent'|'user', text, t}]
  recording_url text,
  created_at timestamptz default now()
);

create table verdicts (
  id uuid primary key default uuid_generate_v4(),
  candidate_id uuid references candidates(id) on delete cascade,
  overall jsonb,                -- {summary, recommendation}
  per_criterion jsonb,         -- [{name, score, justification, quotes:[string]}]
  created_at timestamptz default now()
);
```
Storage: create a **public** bucket `recordings` (public read for demo simplicity — note this in the consent copy). For the demo, **disable RLS** or add permissive policies so the anon key can read/write. (Security shortcut acceptable for a hackathon demo; flag it on a "future work" slide.)

## 3. File structure (target)
```
src/
  app/
    page.tsx                    # landing pitch (see landing-pitch.md)
    roles/page.tsx              # employer: list roles + "New role"
    roles/new/page.tsx          # voice authoring flow
    roles/[roleId]/page.tsx     # edit generated assessment
    candidates/[candidateId]/page.tsx   # employer: verdict dashboard
    interview/[candidateId]/page.tsx    # candidate interview (orb)
    api/
      transcribe/route.ts       # Whisper: audio -> text
      generate/route.ts         # description (+answers) -> rubric/questions JSON
      eleven-signed-url/route.ts# mint ElevenLabs signed URL / agent override
      score/route.ts            # transcript + rubric -> verdict JSON
  components/
    VoiceOrb.tsx                # canvas amplitude animation
    WebcamTile.tsx
    VerdictCard.tsx             # score -> expand -> highlighted quote
  lib/
    supabase.ts                 # client + server helpers
    openai.ts
    prompts.ts                  # all prompt templates, JSON-only
```

## 4. Phase-by-phase (definition of done = the demo works)

### Phase 0 — Skeleton + deploy ✅ when: live Vercel URL renders, `/roles` and `/interview/x` route, schema applied.
- Landing page from `landing-pitch.md`. Nav. Empty Roles page + New role button. Stub candidate route.

### Phase 1 — Voice authoring → assessment (the opening wow) ✅ when: speak a role → editable rubric + questions saved to `roles`.
- `roles/new`: MediaRecorder records mic → POST to `/api/transcribe` (Whisper) → show text. **Text fallback textarea always visible.**
- POST text to `/api/generate`. Prompt returns JSON-only: 1–2 follow-up questions first; after answers, returns `{rubric:[{name,good,bad}], test_questions:[3], interview_questions:[5]}`. **Validate JSON, retry once on parse fail.**
- Editable form for all fields; add custom must-ask questions; toggle `test_enabled`. Save to `roles`.

### Phase 2 — Candidate interview (THE HERO — spend the most time here) ✅ when: full voice interview runs, orb reacts to AI voice, transcript + recording saved.
- `interview/[candidateId]`: Zoom layout — webcam corner tile + center **VoiceOrb**. **Consent line on screen: "This interview is recorded (audio + video)."**
- ElevenLabs Conversational AI via `@elevenlabs/react` `useConversation`. Server route `/api/eleven-signed-url` mints a signed URL using `ELEVENLABS_API_KEY`.
- Pass the role's `interview_questions` + `rubric` into the agent via **dynamic variables / prompt override** so one agent handles any role. Agent behavior: ask the questions conversationally; **one adaptive follow-up per answer**; if candidate asks "how am I judged?" answer honestly from the rubric. ← *this two-way honesty is our "strike where others don't" ElevenLabs differentiator; make it shine.*
- **VoiceOrb:** canvas; size/brightness driven by output audio amplitude (use the SDK's output frequency/volume data or a WebAudio AnalyserNode on the output stream). Keep lightweight — one orb, idle pulse + speech reaction.
- Record audio+video with MediaRecorder → upload blob to Supabase `recordings` → save `recording_url`. Capture transcript from the conversation callbacks → save `turns` + `full_text` to `transcripts`. Set candidate `status='completed'`.

### Phase 3 — Glass-box verdict (kept lightweight, but it's our originality + ethics shield) ✅ when: verdict where every score links to its transcript quote; recordings viewable.
- POST transcript + rubric to `/api/score`. JSON-only: `{overall:{summary,recommendation}, per_criterion:[{name,score,justification,quotes:[exact transcript strings]}]}`. Validate + retry once.
- `candidates/[candidateId]`: overall verdict + per-criterion scores; each row **expands to reveal the exact quote highlighted in the transcript below**. Audio/video players. Manual **Advance / Reject** buttons (update `status`). Make the quote-highlight the visual centerpiece.

### Phase 4 — Demo hardening (last) ✅ when: the scripted Customer Support run is flawless.
- **Seed the Customer Support role fully** (rubric + 5 interview questions) via a SQL seed or a `/api/seed` route, so the demo never depends on live generation.
- Pre-create one candidate so `/interview/[id]` is one click. Optional: a known-good scripted answer path.
- Failure handling: mic denied → show text fallback / friendly message; API timeout → spinner + retry; ElevenLabs fail → graceful error, not a white screen.
- Polish the 3 on-camera moments only: voice authoring, the orb interview, the glass-box reveal.

## 5. Prompts (all JSON-only, in `lib/prompts.ts`)
- **Generate:** system = "You design hiring assessments. Output ONLY valid JSON matching this schema {…}. No prose." Few-shot one example. Temperature low.
- **Score:** system = "You are a fair, evidence-based assessor. For each rubric criterion give a score 1–5, a one-sentence justification, and 1–3 EXACT quotes copied verbatim from the transcript. Output ONLY JSON. If no evidence exists, say so and score conservatively." ← verbatim quotes are what make the glass-box real; instruct it hard.

## 6. Risks / notes for the dev
- Vercel function timeout: set `export const maxDuration = 60` on `/api/score` and `/api/generate`; consider streaming if slow.
- ElevenLabs agent: create it once in the dashboard, store `ELEVENLABS_AGENT_ID`; drive per-role content via dynamic variables, not new agents.
- Browser perms: request mic+camera early with a clear prompt; always keep the text fallback for authoring.
- Keep components small. Don't build auth, billing, settings, templates.
- Commit after each phase. If something breaks, report it — don't guess.

## 7. Time-box (≈2 days)
- Day 1: Phase 0 + Phase 1 + start Phase 2.
- Day 2 AM: finish Phase 2 (the hero) — this is where ElevenLabs depth wins the bonus.
- Day 2 PM: Phase 3 (lightweight) + Phase 4 hardening + record the 3-min video + deck.
- If time runs out: a flawless Phase 2 voice interview + seeded role + a simple verdict beats a half-working everything.
