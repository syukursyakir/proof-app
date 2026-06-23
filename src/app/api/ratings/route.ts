import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { getUserOrgId } from "@/lib/org";

export const runtime = "nodejs";

// Employer records their own human scores for a candidate (validation harness).
export async function POST(req: Request) {
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  const orgId = await getUserOrgId();
  if (!user || !orgId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const body = await req.json();
  if (!body.candidate_id) {
    return NextResponse.json({ error: "Missing candidate_id" }, { status: 400 });
  }

  // Replace this rater's prior rating for the candidate.
  await sb
    .from("human_ratings")
    .delete()
    .eq("candidate_id", body.candidate_id)
    .eq("rater_user_id", user.id);

  const { data, error } = await sb
    .from("human_ratings")
    .insert({
      candidate_id: body.candidate_id,
      org_id: orgId,
      rater_user_id: user.id,
      per_criterion: body.per_criterion ?? [],
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
