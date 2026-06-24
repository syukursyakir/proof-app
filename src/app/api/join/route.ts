import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { resolveRoleByCode, createCandidateForRole } from "@/lib/candidateToken";

export const runtime = "nodejs";

// Candidate-facing, unauthenticated. A code is either:
//  - a CANDIDATE code (named invite) -> returns the token directly, or
//  - a ROLE code (open, Kahoot-style) -> ask for a name, then self-register.
export async function POST(req: Request) {
  const { code, name } = await req.json();
  const clean = String(code ?? "").toUpperCase().trim();
  if (!clean) return NextResponse.json({ error: "Missing code" }, { status: 400 });

  // 1) Named candidate invite?
  const { data: cand } = await supabaseAdmin()
    .from("candidates")
    .select("access_token, token_expires_at")
    .eq("join_code", clean)
    .maybeSingle();
  if (cand?.access_token) {
    if (cand.token_expires_at && new Date(cand.token_expires_at) < new Date()) {
      return NextResponse.json({ error: "This code has expired" }, { status: 410 });
    }
    return NextResponse.json({ token: cand.access_token });
  }

  // 2) Open role code?
  const role = await resolveRoleByCode(clean);
  if (!role) {
    return NextResponse.json({ error: "Code not found" }, { status: 404 });
  }
  // First hit with no name -> tell the client to collect one.
  if (!name || !String(name).trim()) {
    return NextResponse.json({ needName: true, roleTitle: role.title });
  }
  const token = await createCandidateForRole(role, String(name));
  if (!token) {
    return NextResponse.json({ error: "Could not join" }, { status: 500 });
  }
  return NextResponse.json({ token });
}
