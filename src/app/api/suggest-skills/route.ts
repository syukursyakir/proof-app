import { NextResponse } from "next/server";
import { jsonChat } from "@/lib/openai";
import { SUGGEST_SKILLS_SYSTEM } from "@/lib/prompts";
import { getUserOrgId } from "@/lib/org";

export const runtime = "nodejs";
export const maxDuration = 30;

// Adaptive skill suggestions for a chosen role — powers the click-to-pick flow.
export async function POST(req: Request) {
  try {
    if (!(await getUserOrgId())) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }
    const { role } = await req.json();
    if (!role || typeof role !== "string") {
      return NextResponse.json({ error: "Missing role" }, { status: 400 });
    }
    const out = await jsonChat<{ skills: string[] }>(
      SUGGEST_SKILLS_SYSTEM,
      `Role: ${role}`,
    );
    const skills = Array.isArray(out.skills)
      ? out.skills.filter((s) => typeof s === "string").slice(0, 12)
      : [];
    return NextResponse.json({ skills });
  } catch (e) {
    console.error("suggest-skills error", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
