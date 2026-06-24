import { NextResponse } from "next/server";
import { jsonChat } from "@/lib/openai";
import { CRITIQUE_MCQ_SYSTEM } from "@/lib/prompts";
import { getUserOrgId } from "@/lib/org";
import type { TestQuestion } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

type Critique = {
  items: { id: string; verdict: "good" | "easy" | "flawed"; note: string }[];
};

// Rates each MCQ's difficulty/quality so the employer sees which to harden or
// fix before any candidate takes the test. A proxy for real item statistics.
export async function POST(req: Request) {
  try {
    if (!(await getUserOrgId())) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }
    const { questions } = await req.json();
    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: "No questions" }, { status: 400 });
    }
    const compact = (questions as TestQuestion[]).map((q) => ({
      id: q.id,
      category: q.category,
      question: q.question,
      options: q.options,
      correct_option: q.options?.[q.correct],
    }));
    const out = await jsonChat<Critique>(
      CRITIQUE_MCQ_SYSTEM,
      JSON.stringify({ items: compact }),
    );
    return NextResponse.json({ items: Array.isArray(out.items) ? out.items : [] });
  } catch (e) {
    console.error("critique-mcq error", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
