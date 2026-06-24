import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { ensureOrgForUser } from "@/lib/org";

export const runtime = "nodejs";

// Exchanges the OAuth code for a session, ensures the user has a workspace,
// then redirects on.
export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await supabaseServer();
    await supabase.auth.exchangeCodeForSession(code);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      try {
        await ensureOrgForUser(user.id, user.email ?? null);
      } catch (e) {
        console.error("ensureOrgForUser failed", e);
      }
    }
  }
  return NextResponse.redirect(`${origin}${next}`);
}
