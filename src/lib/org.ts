import { cache } from "react";
import { supabaseServer } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase";

// Returns the current user's org id (null if not signed in / no membership).
// React-cached so repeated calls within one request hit the network once.
export const getUserOrgId = cache(async (): Promise<string | null> => {
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await sb
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  return data?.org_id ?? null;
});

// Returns the current user's org id + name (null if none).
export async function getUserOrg(): Promise<{ id: string; name: string } | null> {
  const orgId = await getUserOrgId();
  if (!orgId) return null;
  const { data } = await supabaseAdmin()
    .from("organizations")
    .select("id, name")
    .eq("id", orgId)
    .single();
  return data ? { id: data.id as string, name: (data.name as string) ?? "" } : null;
}

// Ensures a signed-in user has a personal workspace; creates one on first login.
// Uses the service-role client (org/membership creation bypasses RLS by design).
export async function ensureOrgForUser(userId: string, email: string | null) {
  const admin = supabaseAdmin();
  const { data: existing } = await admin
    .from("org_members")
    .select("org_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  if (existing) return existing.org_id as string;

  const { data: org } = await admin
    .from("organizations")
    .insert({ name: email ? `${email}'s workspace` : "Workspace" })
    .select()
    .single();
  await admin
    .from("org_members")
    .insert({ org_id: org!.id, user_id: userId, role: "owner" });
  return org!.id as string;
}
