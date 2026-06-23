import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import { supabaseServer } from "@/lib/supabase-server";
import SignOutButton from "@/components/SignOutButton";
import type { Role } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function RolesPage() {
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();

  let roles: Role[] = [];
  let dbError: string | null = null;
  try {
    const supa = supabaseAdmin();
    const { data, error } = await supa
      .from("roles")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) dbError = error.message;
    else roles = (data as Role[]) ?? [];
  } catch (e) {
    dbError = e instanceof Error ? e.message : "Database error";
  }

  return (
    <div className="flex flex-col flex-1">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="inline-block h-5 w-5 rounded-full bg-accent shadow-[0_0_18px_4px_rgba(109,94,248,0.6)]" />
            Proof
          </Link>
          <div className="flex items-center gap-3">
            {user?.email && (
              <span className="hidden text-sm text-muted sm:inline">
                {user.email}
              </span>
            )}
            <Link
              href="/roles/new"
              className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-white hover:bg-accent-soft"
            >
              + New role
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">Roles</h1>
        <p className="mt-2 text-muted">Describe a role by voice and Proof builds the assessment.</p>

        {dbError && (
          <div className="mt-8 rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-4 text-sm text-yellow-800">
            Couldn&apos;t reach the database. Make sure you ran{" "}
            <code>supabase/001_init.sql</code> in Supabase. ({dbError})
          </div>
        )}

        {!dbError && roles.length === 0 && (
          <div className="mt-10 rounded-2xl border border-dashed border-border p-12 text-center">
            <p className="text-muted">No roles yet.</p>
            <Link
              href="/roles/new"
              className="mt-4 inline-block rounded-full bg-accent px-6 py-2.5 font-medium text-white hover:bg-accent-soft"
            >
              🎙️ Describe your first role
            </Link>
          </div>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {roles.map((r) => (
            <Link
              key={r.id}
              href={`/roles/${r.id}`}
              className="rounded-2xl border border-border bg-card/50 p-6 transition-colors hover:border-accent"
            >
              <h2 className="text-lg font-semibold">{r.title}</h2>
              <p className="mt-2 line-clamp-2 text-sm text-muted">
                {r.description_raw ?? "—"}
              </p>
              <p className="mt-4 text-xs text-muted">
                {r.rubric?.length ?? 0} criteria ·{" "}
                {r.interview_questions?.length ?? 0} interview questions
              </p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
