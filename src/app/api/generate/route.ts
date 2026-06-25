import { NextResponse } from "next/server";
import { jsonChat } from "@/lib/openai";
import {
  FOLLOWUP_SYSTEM,
  buildAssessmentSystem,
  buildMcqBatchSystem,
  buildMcqFixSystem,
  CRITIQUE_MCQ_SYSTEM,
} from "@/lib/prompts";
import { getUserOrgId } from "@/lib/org";
import { shuffleMcqOptions } from "@/lib/shuffle";
import type { Assessment, TestQuestion } from "@/lib/types";

export const maxDuration = 90;
export const runtime = "nodejs";

type McqOut = { test_mcq: TestQuestion[] };
type Critique = { items: { id: string; verdict: "good" | "easy" | "flawed"; note: string }[] };

const CATEGORIES = ["numerical", "verbal", "logical", "sjt"] as const;
const PER_CATEGORY = 3;
// Live-tested: one serial 12-item call on the default model takes a while and
// reasoning_effort makes it dramatically slower/costlier for no measurable
// quality gain over the schema reasoning-field trick alone (see openai.ts).
// Running 4 smaller calls — one per category — CONCURRENTLY on the plain
// default model is both fast (~15-20s total) and cheap (~$0.05/role).

// Generates the 12 aptitude MCQs as 4 concurrent per-category calls, then runs
// every item through the existing critique prompt and auto-rewrites anything
// flagged "easy" or "flawed" (also batched by category, concurrently) — instead
// of leaving that to an employer who, in practice, never clicks "check
// difficulty" themselves. Non-fatal: if this whole step fails, the role is
// still created with an empty test_mcq (the employer can add questions
// manually), since the rubric/interview/skills content is independently
// valuable.
async function generateMcq(
  roleTitle: string,
  description: string,
  answers: unknown,
  locale: string,
): Promise<TestQuestion[]> {
  const context = `Role: ${roleTitle}\nRole description:\n${description}\n\nEmployer's clarifying answers:\n${JSON.stringify(answers)}`;

  const batches = await Promise.all(
    CATEGORIES.map((category) =>
      jsonChat<McqOut>(buildMcqBatchSystem(category, PER_CATEGORY, locale), context).catch((e) => {
        console.error(`mcq batch (${category}) failed`, e);
        return { test_mcq: [] as TestQuestion[] };
      }),
    ),
  );
  let mcq = batches.flatMap((b) => (Array.isArray(b.test_mcq) ? b.test_mcq : []));
  if (mcq.length === 0) return mcq;
  // Re-id sequentially — each batch independently numbered its own items, so
  // ids collide across batches until renumbered.
  mcq = mcq.map((q, i) => ({ ...q, id: `q${i + 1}` })).map(shuffleMcqOptions);

  const compact = mcq.map((q) => ({
    id: q.id,
    category: q.category,
    question: q.question,
    options: q.options,
    correct_option: q.options[q.correct],
  }));
  const critique = await jsonChat<Critique>(CRITIQUE_MCQ_SYSTEM, JSON.stringify({ items: compact }));
  const verdictById = new Map((critique.items ?? []).map((it) => [it.id, it.verdict]));
  const notesById = new Map((critique.items ?? []).map((it) => [it.id, it.note]));
  const flagged = mcq.filter((q) => {
    const verdict = verdictById.get(q.id);
    return verdict && verdict !== "good";
  });
  if (flagged.length === 0) return mcq;

  // Fix flagged items grouped by category, concurrently — same latency logic
  // as generation: smaller parallel calls beat one larger serial one.
  const flaggedByCategory = new Map<string, TestQuestion[]>();
  for (const q of flagged) {
    flaggedByCategory.set(q.category, [...(flaggedByCategory.get(q.category) ?? []), q]);
  }
  const fixSystem = buildMcqFixSystem(locale);
  const fixedGroups = await Promise.all(
    Array.from(flaggedByCategory.values()).map((items) =>
      jsonChat<McqOut>(
        fixSystem,
        JSON.stringify({
          role: roleTitle,
          items: items.map((q) => ({
            id: q.id,
            category: q.category,
            question: q.question,
            options: q.options,
            correct: q.correct,
            reviewer_note: notesById.get(q.id),
          })),
        }),
      ).catch((e) => {
        console.error("mcq fix batch failed", e);
        return { test_mcq: [] as TestQuestion[] };
      }),
    ),
  );
  const fixedById = new Map(
    fixedGroups
      .flatMap((g) => (Array.isArray(g.test_mcq) ? g.test_mcq : []))
      .map((q) => [q.id, shuffleMcqOptions(q)] as const),
  );
  return mcq.map((q) => fixedById.get(q.id) ?? q);
}

export async function POST(req: Request) {
  try {
    // Employer-only (denial-of-wallet protection).
    if (!(await getUserOrgId())) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }
    const { description, answers, language } = await req.json();
    if (!description || typeof description !== "string") {
      return NextResponse.json({ error: "Missing description" }, { status: 400 });
    }

    // Stage 1: no answers yet -> return sharpening follow-up questions.
    if (!answers) {
      const out = await jsonChat<{ followups: string[] }>(
        FOLLOWUP_SYSTEM,
        `Role description (spoken by the employer):\n${description}`,
      );
      return NextResponse.json({
        stage: "followups",
        followups: Array.isArray(out.followups) ? out.followups.slice(0, 2) : [],
      });
    }

    const locale = typeof language === "string" ? language : "en";

    // Stage 2: answers provided -> return the full assessment.
    const out = await jsonChat<Assessment>(
      buildAssessmentSystem(locale),
      `Role description:\n${description}\n\nEmployer's clarifying answers:\n${JSON.stringify(
        answers,
      )}`,
    );

    try {
      out.test_mcq = await generateMcq(out.title ?? "this role", description, answers, locale);
    } catch (e) {
      console.error("mcq generation error", e);
      out.test_mcq = [];
    }

    return NextResponse.json({ stage: "assessment", ...out });
  } catch (e) {
    console.error("generate error", e);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
