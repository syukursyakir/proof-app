import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

// Resolve a short join code to its access token (candidate-facing, unauthenticated).
export async function POST(req: Request) {
  const { code } = await req.json();
  if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });

  const { data } = await supabaseAdmin()
    .from("candidates")
    .select("access_token, token_expires_at")
    .eq("join_code", String(code).toUpperCase().trim())
    .maybeSingle();

  if (!data?.access_token) {
    return NextResponse.json({ error: "Code not found" }, { status: 404 });
  }
  if (data.token_expires_at && new Date(data.token_expires_at) < new Date()) {
    return NextResponse.json({ error: "This code has expired" }, { status: 410 });
  }
  return NextResponse.json({ token: data.access_token });
}
