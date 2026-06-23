import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const roleId = searchParams.get("role_id");
  const supa = supabaseAdmin();
  let query = supa.from("candidates").select("*").order("created_at", {
    ascending: false,
  });
  if (roleId) query = query.eq("role_id", roleId);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();
  if (!body.role_id) {
    return NextResponse.json({ error: "Missing role_id" }, { status: 400 });
  }
  const supa = supabaseAdmin();
  const { data, error } = await supa
    .from("candidates")
    .insert({ role_id: body.role_id, name: body.name ?? "Candidate" })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
