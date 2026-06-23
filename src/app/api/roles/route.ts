import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET() {
  const supa = supabaseAdmin();
  const { data, error } = await supa
    .from("roles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();
  const supa = supabaseAdmin();
  const { data, error } = await supa
    .from("roles")
    .insert({
      title: body.title ?? "Untitled role",
      description_raw: body.description_raw ?? null,
      rubric: body.rubric ?? null,
      test_questions: body.test_questions ?? null,
      interview_questions: body.interview_questions ?? null,
      test_enabled: body.test_enabled ?? true,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: Request) {
  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const supa = supabaseAdmin();
  const { id, ...fields } = body;
  const { data, error } = await supa
    .from("roles")
    .update(fields)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
