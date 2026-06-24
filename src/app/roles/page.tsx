import Link from "next/link";
import { supabaseServer } from "@/lib/supabase-server";
import SignOutButton from "@/components/SignOutButton";
import { Reveal, Stagger, Item } from "@/components/motion";
import type { Candidate, Role } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function RolesPage() {
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();

  let roles: Role[] = [];
  let dbError: string | null = null;
  try {
    const { data, error } = await sb
      .from("roles")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) dbError = error.message;
    else roles = (data as Role[]) ?? [];
  } catch (e) {
    dbError = e instanceof Error ? e.message : "Database error";
  }

  let candidates: Candidate[] = [];
  if (roles.length > 0) {
    try {
      const { data } = await sb
        .from("candidates")
        .select("id, role_id, name, status, created_at")
        .in(
          "role_id",
          roles.map((r) => r.id),
        )
        .order("created_at", { ascending: false });
      candidates = (data as Candidate[]) ?? [];
    } catch {
      // non-critical
    }
  }

  const roleTitle = new Map(roles.map((r) => [r.id, r.title]));
  const done = candidates.filter((c) =>
    ["advanced", "rejected", "completed"].includes(c.status),
  );
  const needsReview = candidates.filter((c) => c.status === "completed");

  // Per-role tallies for the cards.
  const perRole = new Map<string, { total: number; review: number }>();
  for (const c of candidates) {
    const t = perRole.get(c.role_id) ?? { total: 0, review: 0 };
    t.total += 1;
    if (c.status === "completed") t.review += 1;
    perRole.set(c.role_id, t);
  }

  const stats = [
    { label: "Roles", value: roles.length },
    { label: "Candidates", value: candidates.length },
    { label: "Interviewed", value: done.length },
    { label: "Awaiting review", value: needsReview.length, accent: true },
  ];

  return (
    <div className="flex flex-col flex-1">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="inline-block h-5 w-5 rounded-full bg-accent shadow-[0_0_18px_4px_rgba(109,94,248,0.6)]" />
            Clarion
          </Link>
          <div className="flex items-center gap-3">
            {user?.email && (
              <span className="hidden text-sm text-muted sm:inline">{user.email}</span>
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
        <Reveal>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-2 text-muted">
            {user?.email ? `Signed in as ${user.email}. ` : ""}
            Your roles, candidates, and what needs your attention.
          </p>
        </Reveal>

        {dbError && (
          <div className="mt-8 rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-4 text-sm text-yellow-800">
            Couldn&apos;t reach the database. Make sure you ran{" "}
            <code>supabase/001_init.sql</code> in Supabase. ({dbError})
          </div>
        )}

        {/* Stat cards */}
        {roles.length > 0 && (
          <Stagger className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {stats.map((s) => (
              <Item
                key={s.label}
                className={`rounded-2xl border bg-card/50 p-5 ${
                  s.accent && s.value > 0
                    ? "border-amber-300 bg-amber-50/50"
                    : "border-border"
                }`}
              >
                <div
                  className={`text-3xl font-semibold ${
                    s.accent && s.value > 0 ? "text-amber-700" : "text-foreground"
                  }`}
                >
                  {s.value}
                </div>
                <div className="mt-1 text-sm text-muted">{s.label}</div>
              </Item>
            ))}
          </Stagger>
        )}

        {/* Needs your review */}
        {needsReview.length > 0 && (
          <Reveal className="mt-10">
            <h2 className="text-lg font-semibold">Needs your review</h2>
            <p className="mt-1 text-sm text-muted">
              These candidates finished their assessment and are waiting on your
              decision.
            </p>
            <div className="mt-4 space-y-2">
              {needsReview.map((c) => (
                <Link
                  key={c.id}
                  href={`/candidates/${c.id}`}
                  className="lift flex items-center justify-between rounded-xl border border-border bg-card/50 px-4 py-3 hover:border-accent"
                >
                  <div>
                    <span className="font-medium">{c.name ?? "Candidate"}</span>
                    <span className="ml-3 text-sm text-muted">
                      {roleTitle.get(c.role_id) ?? "—"}
                    </span>
                  </div>
                  <span className="flex items-center gap-3">
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                      Awaiting review
                    </span>
                    <span className="text-sm font-medium text-accent-soft">
                      Review verdict →
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </Reveal>
        )}

        {/* Roles */}
        <div className="mt-12 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Roles</h2>
        </div>

        {!dbError && roles.length === 0 && (
          <div className="mt-4 rounded-2xl border border-dashed border-border p-12 text-center">
            <p className="text-muted">No roles yet.</p>
            <Link
              href="/roles/new"
              className="mt-4 inline-block rounded-full bg-accent px-6 py-2.5 font-medium text-white hover:bg-accent-soft"
            >
              Build your first assessment
            </Link>
          </div>
        )}

        <Stagger className="mt-4 grid gap-4 sm:grid-cols-2">
          {roles.map((r) => {
            const t = perRole.get(r.id);
            return (
              <Item key={r.id} className="h-full">
                <Link
                  href={`/roles/${r.id}`}
                  className="lift block h-full rounded-2xl border border-border bg-card/50 p-6 hover:border-accent"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-semibold">{r.title}</h3>
                    {t && t.review > 0 && (
                      <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                        {t.review} to review
                      </span>
                    )}
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-muted">
                    {r.description_raw ?? "—"}
                  </p>
                  <p className="mt-4 text-xs text-muted">
                    {t?.total ?? 0} candidate{(t?.total ?? 0) === 1 ? "" : "s"} ·{" "}
                    {r.rubric?.length ?? 0} criteria ·{" "}
                    {r.interview_questions?.length ?? 0} questions
                  </p>
                </Link>
              </Item>
            );
          })}
        </Stagger>
      </main>
    </div>
  );
}
