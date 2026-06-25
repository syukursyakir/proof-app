import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { resolveToken } from "@/lib/candidateToken";
import { buildInterviewPrompt } from "@/lib/prompts";

export const runtime = "nodejs";

// Assembles the ElevenLabs system prompt server-side, from the role's full
// rubric/terms/resume-claims data, and returns only the finished prose string.
// Previously this was built in the browser (InterviewRoom.tsx called
// buildInterviewPrompt directly), which meant the raw structured rubric — the
// "bad" anchor text, every BARS level, the full glossary — had to be shipped
// to the candidate's client as plain props/state to do that. This can't fully
// eliminate exposure (ElevenLabs' documented flow requires the *browser* to
// send the prompt override over the WebSocket at session start — there's no
// server-side "bake the prompt into the signed URL" option), but it removes
// the easiest leak: the structured, clearly-labelled ingredients no longer
// need to sit in client memory/props at all, only the assembled prose does.
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const candidate = await resolveToken(token);
  if (!candidate) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  const { data: role } = await supabaseAdmin()
    .from("roles")
    .select("title, interview_questions, rubric, terms, language")
    .eq("id", candidate.role_id)
    .single();
  if (!role) return NextResponse.json({ error: "Role not found" }, { status: 404 });

  const systemPrompt = buildInterviewPrompt(
    role.title,
    role.interview_questions ?? [],
    role.rubric ?? [],
    role.terms ?? [],
    candidate.resume_claims ?? [],
    role.language ?? "en",
  );
  return NextResponse.json({ systemPrompt });
}
