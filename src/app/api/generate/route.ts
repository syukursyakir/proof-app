import { NextResponse } from "next/server";
import { jsonChat } from "@/lib/openai";
import { FOLLOWUP_SYSTEM, ASSESSMENT_SYSTEM } from "@/lib/prompts";
import { getUserOrgId } from "@/lib/org";
import type { Assessment } from "@/lib/types";

export const maxDuration = 60;
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    // Employer-only (denial-of-wallet protection).
    if (!(await getUserOrgId())) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }
    const { description, answers } = await req.json();
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

    // Stage 2: answers provided -> return the full assessment.
    const out = await jsonChat<Assessment>(
      ASSESSMENT_SYSTEM,
      `Role description:\n${description}\n\nEmployer's clarifying answers:\n${JSON.stringify(
        answers,
      )}`,
    );
    return NextResponse.json({ stage: "assessment", ...out });
  } catch (e) {
    console.error("generate error", e);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
