import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { resolveToken } from "@/lib/candidateToken";
import { extractResumeClaims } from "@/lib/resume";

export const runtime = "nodejs";
export const maxDuration = 45;

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
  // The path must be one we minted for THIS candidate (prevents pointing a
  // resume at another candidate's file).
  const prefix = `${cand.org_id ?? "noorg"}/${cand.id}/`;
  if (typeof path !== "string" || !path.startsWith(prefix)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const admin = supabaseAdmin();
  // Persist the resume FIRST so a slow/failed claim extraction can never orphan
  // the upload (required-mode candidates must be able to proceed regardless).
  const { error } = await admin
    .from("candidates")
    .update({ resume_url: path })
    .eq("id", cand.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Best-effort claim extraction for interview probes (never affects scoring).
  // Bounded inside extractResumeClaims; failure just means no resume probes.
  const claims = await extractResumeClaims(path);
  if (claims.length) {
    await admin
      .from("candidates")
      .update({ resume_claims: claims })
      .eq("id", cand.id);
  }
  return NextResponse.json({ ok: true });
}
