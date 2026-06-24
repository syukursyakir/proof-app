import { randomBytes } from "crypto";
import { supabaseAdmin } from "@/lib/supabase";
import type { Candidate } from "@/lib/types";

// Opaque, URL-safe access token for the candidate interview link.
export function genToken(): string {
  return randomBytes(24).toString("base64url");
}

// Short, human-typeable join code (Kahoot/GitHub style), no ambiguous chars.
export function genCode(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const b = randomBytes(8);
  let s = "";
  for (let i = 0; i < 8; i++) s += alphabet[b[i] % alphabet.length];
  return s;
}

// Look up a role by its open join code (case-insensitive).
export async function resolveRoleByCode(
  code: string,
): Promise<{ id: string; title: string; org_id: string | null } | null> {
  if (!code) return null;
  const { data } = await supabaseAdmin()
    .from("roles")
    .select("id, title, org_id")
    .eq("join_code", code.toUpperCase().trim())
    .maybeSingle();
  return (data as { id: string; title: string; org_id: string | null }) ?? null;
}

// Self-register a candidate against a role's open code; returns their token.
export async function createCandidateForRole(
  role: { id: string; org_id: string | null },
  name: string,
): Promise<string | null> {
  const token = genToken();
  const expires = new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString();
  const admin = supabaseAdmin();
  // Retry on the (rare) join_code unique collision.
  for (let attempt = 0; attempt < 4; attempt++) {
    const { error } = await admin.from("candidates").insert({
      role_id: role.id,
      org_id: role.org_id,
      name: (name || "").trim().slice(0, 80) || "Candidate",
      status: "invited",
      access_token: token,
      join_code: genCode(),
      token_expires_at: expires,
    });
    if (!error) return token;
    if (error.code !== "23505") return null; // not a unique violation — give up
  }
  return null;
}

// Resolve a token to its candidate, enforcing expiry. Service-role (candidate
// is unauthenticated) — authorization IS possession of a valid, unexpired token.
export async function resolveToken(token: string): Promise<Candidate | null> {
  if (!token) return null;
  const admin = supabaseAdmin();
  const { data } = await admin
    .from("candidates")
    .select("*")
    .eq("access_token", token)
    .maybeSingle();
  if (!data) return null;
  if (data.token_expires_at && new Date(data.token_expires_at) < new Date()) {
    return null;
  }
  return data as Candidate;
}
