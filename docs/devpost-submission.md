# Proof — Devpost Submission (ready to paste)

> Fill the [bracketed] bits. Live demo + tools are done; you supply the team, video link, and deck link.

## Project name
**Proof — Hire on proof, not pedigree.**

## Team members
[Your name(s)]

## Track
Theme B — Work, Income & Capability (opportunity gated by social capital → skill-based selection).

## Tagline (one line)
The first AI voice interviewer a small employer can actually afford — and trust, because every score links to the exact words behind it.

## Problem statement & target user
**Target user:** small employers and early-stage founders who hire without a recruiting team.
**Problem:** With no time and no recruiters, small employers screen on résumés, referrals, and gut feel — so hiring runs on *social capital, not skill*. Good candidates with the wrong network get filtered out, and every applicant gets a different interview, on a different day, from someone in a different mood. The AI tools that exist are either cheap recorders with no scoring, or expensive black-box enterprise scorers that have been *sued* over how they judge people.

## Solution (2–3 sentences)
Proof lets an employer describe their ideal hire by voice; AI turns it into a structured, role-specific rubric and interview. Every candidate then takes the *same* fair AI voice interview, and the employer gets a glass-box verdict where every score links to the exact transcript quote that earned it — and a human makes the final call.

## Live demo link
https://proof-app-virid.vercel.app/  · Sample verdict: https://proof-app-virid.vercel.app/sample

## Demo video (≤3 min)
[YouTube link — record from docs/demo-video-script.md]

## Pitch deck (≤10 slides)
[link — build from docs/pitch-deck.md]

## Tools used
OpenAI (GPT-4o for rubric generation + transcript scoring; Whisper for voice authoring) · ElevenLabs Conversational AI (the live adaptive voice interview) · Supabase (Postgres, Auth/Google login, Storage) · Vercel · Next.js + TypeScript + Tailwind · Three.js / React Three Fiber (the audio-reactive voice orb).

---

## What it does
Proof runs the whole loop: **(1) Author by voice** — an employer describes the role out loud and AI drafts an editable rubric + interview. **(2) Live AI interview** — a candidate has a natural voice conversation with an ElevenLabs agent that asks the role's questions, follows up adaptively, and answers the candidate's questions honestly (including "how am I being judged?"). **(3) Glass-box verdict** — AI scores the transcript against the rubric, and every score expands to the exact verbatim quote that justifies it, highlighted in context. The employer plays the recording and clicks Advance or Reject. The AI assesses; the human decides.

## How we built it
Next.js (App Router) + TypeScript + Tailwind on Vercel. Supabase for Postgres, Google auth, and recording storage. OpenAI Whisper transcribes the employer's spoken role; GPT-4o generates the rubric/questions and later scores the interview transcript (JSON-only, validated, with verbatim evidence quotes). ElevenLabs Conversational AI runs the interview, with the role's questions + rubric injected at runtime via prompt overrides. The voice orb is a custom GLSL shader (simplex-noise vertex displacement + Fresnel rim) on React Three Fiber, driven by live audio amplitude.

## Challenges we ran into
Making the AI verdict *trustworthy* rather than a black box — we force the model to ground every judgment in a verbatim transcript quote. Getting ElevenLabs to conduct a genuinely adaptive, two-way interview (not a scripted bot) via runtime prompt overrides. And making a glowing 3D orb read well on a clean, professional light theme rather than a "tech demo" dark UI.

## Accomplishments we're proud of
A working end-to-end product, deployed live, where the AI shows its receipts — and a researched understanding that what we built (a structured interview with mechanical scoring) is the single best-validated hiring method in the science.

## What we learned
The selection-science literature: structured interviews are the #1 predictor of job performance (ahead of IQ tests), but only when they're truly structured and scored against behavioral anchors. We also mapped the legal/ethical guardrails (never infer emotion, always keep a human in the loop, offer accessible alternatives).

## What's next
A 20-phase production roadmap (in the repo): real multi-tenancy + security, behaviorally-anchored rubrics validated against human raters (target ICC ≥ .75), defensible cut scores, bias-audit monitoring (NYC Local Law 144), full privacy/compliance (PDPA/GDPR/EU AI Act), and SaaS features (team invites, ATS integration, billing).

## (Optional) GitHub
Private repo `syukursyakir/proof-app` — [make public or invite judges if sharing].
