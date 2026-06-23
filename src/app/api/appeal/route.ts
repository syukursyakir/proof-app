import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { resolveToken } from "@/lib/candidateToken";

export const runtime = "nodejs";

// Candidate requests a human review of their interview (GDPR Art 22 safeguard).
export async function POST(req: Request) {
  const { token } = await req.json();
  const cand = await resolveToken(token);
  if (!cand) {
    return NextResponse.json({ error: "Invalid or expired link" }, { status: 403 });
  }
  await supabaseAdmin()
    .from("candidates")
    .update({ appeal_requested_at: new Date().toISOString() })
    .eq("id", cand.id);
  return NextResponse.json({ ok: true });
}
