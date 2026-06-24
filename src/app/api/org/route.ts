import { NextResponse } from "next/server";
import { getUserOrgId } from "@/lib/org";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

// Update the workspace (company) name. Authorised by org membership; the admin
// client performs the write after the membership check.
export async function PATCH(req: Request) {
  const orgId = await getUserOrgId();
  if (!orgId) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  const { name } = await req.json();
  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const { error } = await supabaseAdmin()
    .from("organizations")
    .update({ name: name.trim().slice(0, 80) })
    .eq("id", orgId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
