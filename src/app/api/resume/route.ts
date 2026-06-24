import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { resolveToken } from "@/lib/candidateToken";
import { extractResumeClaims } from "@/lib/resume";

export const runtime = "nodejs";
export const maxDuration = 30;

// Candidate-facing: save the storage PATH of an uploaded resume against the
// candidate. Authorized by the access token. The resume is context for the
// human employer — it never feeds the AI score. We also extract verifiable
// claims so the interviewer can ask the candidate to substantiate them (this
// happens BEFORE the interview, so it's done synchronously here).
export async function POST(req: Request) {
  const { token, path } = await req.json();
  const cand = await resolveToken(token);
  if (!cand) {
    return NextResponse.json({ error: "Invalid or expired link" }, { status: 403 });
  }
  if (typeof path !== "string" || !path) {
    return NextResponse.json({ error: "Missing path" }, { status: 400 });
  }

  // Best-effort claim extraction for interview probes (never affects scoring).
  const claims = await extractResumeClaims(path);

  const { error } = await supabaseAdmin()
    .from("candidates")
    .update({ resume_url: path, resume_claims: claims.length ? claims : null })
    .eq("id", cand.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
