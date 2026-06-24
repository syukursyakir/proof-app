import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { resolveToken } from "@/lib/candidateToken";

export const runtime = "nodejs";

// Returns the minimal props InterviewRoom needs, authorised by candidate token.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const candidate = await resolveToken(token);
  if (!candidate) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  const { data: role } = await supabaseAdmin()
    .from("roles")
    .select("title, interview_questions, rubric, terms")
    .eq("id", candidate.role_id)
    .single();

  if (!role) return NextResponse.json({ error: "Role not found" }, { status: 404 });

  return NextResponse.json({
    candidateName: candidate.name ?? "Candidate",
    interviewQuestions: role.interview_questions ?? [],
    rubric: role.rubric ?? [],
    terms: role.terms ?? [],
  });
}
