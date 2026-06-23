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
