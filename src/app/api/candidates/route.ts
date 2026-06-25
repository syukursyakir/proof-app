import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { getUserOrgId } from "@/lib/org";
import { genToken, genCode } from "@/lib/candidateToken";

export const runtime = "nodejs";

export async function GET(req: Request) {
  // Defense-in-depth: don't rely on RLS alone for the org gate.
  if (!(await getUserOrgId())) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }
  const sb = await supabaseServer();
  const { searchParams } = new URL(req.url);
  const roleId = searchParams.get("role_id");
  let query = sb
    .from("candidates")
    .select("*")
    .order("created_at", { ascending: false });
  if (roleId) query = query.eq("role_id", roleId);
  const { data, error } = await query; // RLS scopes to the user's org
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const sb = await supabaseServer();
  const orgId = await getUserOrgId();
  if (!orgId)
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  const body = await req.json();
  if (!body.role_id) {
    return NextResponse.json({ error: "Missing role_id" }, { status: 400 });
  }
  // RLS on `candidates` only checks the candidate's own org_id — it never
  // validates that role_id actually belongs to that org. Without this check,
  // any employer could create a candidate row pointing at ANOTHER org's
  // role_id (their own org_id passes the policy's `with check`), which then
  // gets interviewed against and scored on that other org's confidential
  // rubric/questions, with the verdict landing on the attacker's dashboard.
  const { data: role, error: roleErr } = await sb
    .from("roles")
    .select("org_id")
    .eq("id", body.role_id)
    .single();
  if (roleErr || !role || role.org_id !== orgId) {
    return NextResponse.json({ error: "Role not found" }, { status: 404 });
  }
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString();
  const { data, error } = await sb
    .from("candidates")
    .insert({
      role_id: body.role_id,
      name: body.name ?? "Candidate",
      org_id: orgId,
      access_token: genToken(),
      join_code: genCode(),
      token_expires_at: expires,
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
  const ALLOWED = ["invited", "in_progress", "completed", "advanced", "rejected"];
  if (!ALLOWED.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const { data, error } = await sb
    .from("candidates")
    .update({ status: body.status })
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
  // RLS restricts to the user's org. Transcripts/verdicts/ratings cascade.
  const { error } = await sb.from("candidates").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
