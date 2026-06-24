import Link from "next/link";
import { supabaseServer } from "@/lib/supabase-server";
import { Reveal, Stagger, Item } from "@/components/motion";
import type { Candidate, Role } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();

  let roles: Role[] = [];
  let dbError: string | null = null;
  try {
    const { data, error } = await sb.from("roles").select("*");
    if (error) dbError = error.message;
    else roles = (data as Role[]) ?? [];
  } catch (e) {
    dbError = e instanceof Error ? e.message : "Database error";
  }

  let candidates: Candidate[] = [];
  if (roles.length > 0) {
    const { data } = await sb
      .from("candidates")
      .select("id, role_id, name, status, created_at")
      .in("role_id", roles.map((r) => r.id))
      .order("created_at", { ascending: false });
    candidates = (data as Candidate[]) ?? [];
  }

  const roleTitle = new Map(roles.map((r) => [r.id, r.title]));
  const done = candidates.filter((c) =>
    ["advanced", "rejected", "completed"].includes(c.status),
  );
  const needsReview = candidates.filter((c) => c.status === "completed");

  const stats = [
    { label: "Roles", value: roles.length },
    { label: "Candidates", value: candidates.length },
    { label: "Interviewed", value: done.length },
    { label: "Awaiting review", value: needsReview.length, accent: true },
  ];

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-8 py-10">
      <Reveal>
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-2 text-muted">
          {user?.email ? `Signed in as ${user.email}. ` : ""}
          What needs your attention.
        </p>
      </Reveal>

      {dbError && (
        <div className="mt-8 rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-4 text-sm text-yellow-800">
          Couldn&apos;t reach the database. ({dbError})
        </div>
      )}

      <Stagger className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <Item
            key={s.label}
            className={`rounded-2xl border bg-card/50 p-5 ${
              s.accent && s.value > 0 ? "border-amber-300 bg-amber-50/50" : "border-border"
            }`}
          >
            <div
              className={`tnum text-3xl font-semibold ${
                s.accent && s.value > 0 ? "text-amber-700" : "text-foreground"
              }`}
            >
              {s.value}
            </div>
            <div className="mt-1 text-sm text-muted">{s.label}</div>
          </Item>
        ))}
      </Stagger>

      {roles.length === 0 && !dbError && (
        <div className="mt-10 rounded-2xl border border-dashed border-border p-12 text-center">
          <p className="text-muted">No roles yet — build your first assessment.</p>
          <Link
            href="/roles/new"
            className="mt-4 inline-block rounded-full bg-accent px-6 py-2.5 font-medium text-white hover:bg-accent-soft"
          >
            Build your first assessment
          </Link>
        </div>
      )}

      {needsReview.length > 0 ? (
        <Reveal className="mt-10">
          <h2 className="text-lg font-semibold">Needs your review</h2>
          <p className="mt-1 text-sm text-muted">
            Finished their assessment and waiting on your decision.
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
                  <span className="text-sm font-medium text-accent-soft">Review →</span>
                </span>
              </Link>
            ))}
          </div>
        </Reveal>
      ) : (
        roles.length > 0 && (
          <p className="mt-10 rounded-xl border border-border bg-card/40 px-4 py-6 text-center text-sm text-muted">
            Nothing waiting on you. New completed assessments show up here.
          </p>
        )
      )}
    </main>
  );
}
