# Clarion — Devpost Story (ready to paste)

## Inspiration
It started with a feeling we both recognised: knowing you could do a job well, but never getting the chance to prove it — because of where you went to school, who you know, or how polished your resume looks. Before writing a line of code, we surveyed 21 people — students, working adults, job seekers — to check if that feeling was real or just us. It wasn't just us. 76% said they'd felt exactly that, and 81% pointed to non-skill factors — school, work experience, background, contacts — as the biggest reason their applications get passed over. At the same time, AI resume generators have made every resume look identical and perfectly keyword-optimised, so the one signal employers used to lean on is collapsing. The only thing AI can't fake for a candidate is actually *doing the work*. That's Clarion.

## What it does
Clarion runs the whole loop: **(1) Author a role** — an employer describes it by voice or picks a category/role/skills, chooses the candidate's interview language (11 supported, not just English), and AI drafts an editable rubric + interview in that language. **(2) Live AI interview** — a candidate has a natural voice conversation, in their own language, with an ElevenLabs agent that asks the role's questions, follows up adaptively, and answers the candidate's questions honestly (including "how am I being judged?"). **(3) Glass-box verdict** — AI scores the transcript against the rubric, and every score expands to the exact verbatim quote that justifies it, highlighted in context. The employer plays the recording and clicks Advance or Reject. The AI assesses; the human decides.

## How we built it
Next.js (App Router) + TypeScript + Tailwind on Vercel. Supabase for Postgres, Google auth, and recording storage. OpenAI Whisper transcribes the employer's spoken role; GPT-4o generates the rubric/questions and later scores the interview transcript (JSON-only, validated, with verbatim evidence quotes). ElevenLabs Conversational AI runs the interview, with the role's questions + rubric injected at runtime via prompt overrides. The voice orb is a custom GLSL shader (simplex-noise vertex displacement + Fresnel rim) on React Three Fiber, driven by live audio amplitude.

## Challenges we ran into
Making the AI verdict *trustworthy* rather than a black box — we force the model to ground every judgment in a verbatim transcript quote. Getting ElevenLabs to conduct a genuinely adaptive, two-way interview (not a scripted bot) via runtime prompt overrides. Supporting 11 languages end-to-end was sneakier than it looked: the candidate's chosen language controlled the UI and the live interview's spoken language, but we initially missed that the *generation* step never received that language — so a role set to Malay still generated English questions. Fixing it meant pushing the language choice through the prompt that drafts the assessment, not just the one that runs the interview. And making a glowing 3D orb read well on a clean, professional light theme rather than a "tech demo" dark UI.

## Accomplishments that we're proud of
A working end-to-end product, deployed live, where the AI shows its receipts — running fully in 11 languages, not just English, so candidates aren't filtered by fluency on top of pedigree. We also validated the problem before building: surveyed 21 people first, and 76%/81%/71% confirmed the exact pain we set out to fix. The assessment design (structured interview + skills work-sample + light aptitude screen) is grounded in the single best-validated combination in the selection-science literature.

## What we learned
The selection-science literature: structured interviews are the #1 predictor of job performance (ahead of IQ tests), but only when they're truly structured and scored against behavioral anchors. We also mapped the legal/ethical guardrails (never infer emotion, always keep a human in the loop, offer accessible alternatives).

## What's next for Clarion.fyi
A 20-phase production roadmap: real multi-tenancy + security, behaviorally-anchored rubrics validated against human raters (target ICC ≥ .75), defensible cut scores, bias-audit monitoring (NYC Local Law 144), full privacy/compliance (PDPA/GDPR/EU AI Act), and SaaS features (team invites, ATS integration, billing).
