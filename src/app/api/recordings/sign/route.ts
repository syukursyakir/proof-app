import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { resolveToken } from "@/lib/candidateToken";

export const runtime = "nodejs";

// Mints a one-time signed UPLOAD url for the private recordings bucket so the
// candidate's browser can upload directly (no public bucket, no 4.5MB function
// body limit). Authorized by the candidate's access token.
export async function POST(req: Request) {
  const { token } = await req.json();
  const cand = await resolveToken(token);
  if (!cand) {
    return NextResponse.json({ error: "Invalid or expired link" }, { status: 403 });
  }
  const path = `${cand.org_id ?? "noorg"}/${cand.id}/${Date.now()}.webm`;
  const admin = supabaseAdmin();
  const { data, error } = await admin.storage
    .from("recordings")
    .createSignedUploadUrl(path);
  if (error || !data) {
    return NextResponse.json({ error: "Could not sign upload" }, { status: 500 });
  }
  return NextResponse.json({ path: data.path, signedToken: data.token });
}
