import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { getUserOrgId } from "@/lib/org";
import { genCode } from "@/lib/candidateToken";

export const runtime = "nodejs";

// All employer queries run through the user-scoped (cookie) client, so RLS
// enforces org isolation.
export async function GET() {
  if (!(await getUserOrgId())) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }
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
      resume_mode: body.resume_mode ?? "optional",
      language: body.language ?? "en",
      join_code: genCode(),
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
  // Whitelist updatable columns — never let a client overwrite id, org_id,
  // join_code, or created_at via the request body.
  const UPDATABLE = [
    "title",
    "description_raw",
    "occupation",
    "rubric",
    "test_questions",
    "test_mcq",
    "interview_questions",
    "terms",
    "test_enabled",
    "resume_mode",
    "language",
  ] as const;
  const fields: Record<string, unknown> = {};
  for (const k of UPDATABLE) {
    if (body[k] !== undefined) fields[k] = body[k];
  }
  // RLS restricts the update to rows in the user's org.
  const { data, error } = await sb
    .from("roles")
    .update(fields)
    .eq("id", body.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: Request) {
  const sb = await supabaseServer();
  if (!(await getUserOrgId())) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  // RLS restricts the delete to the user's org. Candidates/transcripts/verdicts
  // cascade automatically.
  const { error } = await sb.from("roles").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
