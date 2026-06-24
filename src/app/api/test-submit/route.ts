import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { resolveToken } from "@/lib/candidateToken";
import type { TestQuestion } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { token, answers, proctor_recording_url, proctor_share_lost } =
      await req.json();
    if (!token || typeof answers !== "object") {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const candidate = await resolveToken(token);
    if (!candidate) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Fetch the role's MCQ questions to score the answers server-side.
    const { data: role } = await supabaseAdmin()
      .from("roles")
      .select("test_mcq")
      .eq("id", candidate.role_id)
      .single();

    const questions: TestQuestion[] = (role?.test_mcq as TestQuestion[]) ?? [];
    let correct = 0;
    for (const q of questions) {
      if (answers[q.id] === q.correct) correct++;
    }

    await supabaseAdmin()
      .from("candidates")
      .update({
        aptitude_score: correct,
        aptitude_max: questions.length,
        aptitude_answers: answers,
        proctor_recording_url:
          typeof proctor_recording_url === "string" ? proctor_recording_url : null,
      })
      .eq("id", candidate.id);
    void proctor_share_lost; // reserved: surface a share-interruption flag later

    return NextResponse.json({ score: correct, max: questions.length });
  } catch (e) {
    console.error("test-submit error", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
