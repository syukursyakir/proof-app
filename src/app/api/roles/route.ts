import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { getUserOrgId } from "@/lib/org";

export const runtime = "nodejs";

// All employer queries run through the user-scoped (cookie) client, so RLS
// enforces org isolation.
export async function GET() {
  const sb = await supabaseServer();
  const { data, error } = await sb
    .from("roles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const sb = await supabaseServer();
  const orgId = await getUserOrgId();
  if (!orgId)
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  const body = await req.json();
  const { data, error } = await sb
    .from("roles")
    .insert({
      org_id: orgId,
      title: body.title ?? "Untitled role",
      description_raw: body.description_raw ?? null,
      occupation: body.occupation ?? null,
      rubric: body.rubric ?? null,
      test_questions: body.test_questions ?? null,
      test_mcq: body.test_mcq ?? null,
      interview_questions: body.interview_questions ?? null,
      terms: body.terms ?? null,
      test_enabled: body.test_enabled ?? true,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: Request) {
  const sb = await supabaseServer();
  const orgId = await getUserOrgId();
  if (!orgId)
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const { id, org_id: _ignore, ...fields } = body;
  void _ignore;
  // RLS restricts the update to rows in the user's org.
  const { data, error } = await sb
    .from("roles")
    .update(fields)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
