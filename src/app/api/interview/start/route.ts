import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { resolveToken } from "@/lib/candidateToken";

export const runtime = "nodejs";

// Candidate clicked "Start" — log consent + mark interviewing. Authorized by token.
export async function POST(req: Request) {
  const { token } = await req.json();
  const cand = await resolveToken(token);
  if (!cand) {
    return NextResponse.json({ error: "Invalid or expired link" }, { status: 403 });
  }
  const admin = supabaseAdmin();
  await admin
    .from("candidates")
    .update({
      status: "interviewing",
      consent_at: cand.consent_at ?? new Date().toISOString(),
      interview_started_at: new Date().toISOString(),
    })
    .eq("id", cand.id);
  return NextResponse.json({ ok: true });
}
