import Link from "next/link";
import { supabaseServer } from "@/lib/supabase-server";
import { Reveal } from "@/components/motion";
import type { Candidate, Role } from "@/lib/types";

export const dynamic = "force-dynamic";

const statusPill: Record<string, string> = {
  invited: "bg-slate-100 text-slate-600",
  interviewing: "bg-amber-50 text-amber-700",
  completed: "bg-blue-50 text-blue-700",
  advanced: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-700",
};
const statusLabel: Record<string, string> = {
  invited: "Invited",
  interviewing: "In progress",
  completed: "Completed",
  advanced: "Advanced",
  rejected: "Rejected",
};

const ORDER = ["completed", "interviewing", "invited", "advanced", "rejected"];

export default async function CandidatesPage() {
  const sb = await supabaseServer();

  const { data: roleRows } = await sb.from("roles").select("id, title");
  const roles = (roleRows as Pick<Role, "id" | "title">[]) ?? [];
  const roleTitle = new Map(roles.map((r) => [r.id, r.title]));

  let candidates: Candidate[] = [];
  if (roles.length > 0) {
    const { data } = await sb
      .from("candidates")
      .select("id, role_id, name, status, created_at")
      .in("role_id", roles.map((r) => r.id))
      .order("created_at", { ascending: false });
    candidates = (data as Candidate[]) ?? [];
  }

  // Sort: actionable statuses first, then by recency (already date-desc within).
  const sorted = [...candidates].sort(
    (a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status),
  );

  const counts: Record<string, number> = {};
  for (const c of candidates) counts[c.status] = (counts[c.status] ?? 0) + 1;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-8 py-10">
      <Reveal>
        <h1 className="text-3xl font-semibold tracking-tight">Candidates</h1>
        <p className="mt-2 text-muted">Everyone in your pipeline, across all roles.</p>
        {candidates.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            {ORDER.filter((s) => counts[s]).map((s) => (
              <span
                key={s}
                className={`rounded-full px-2.5 py-1 font-medium ${statusPill[s]}`}
              >
                {counts[s]} {statusLabel[s]}
              </span>
            ))}
          </div>
        )}
      </Reveal>

      {candidates.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted">
          No candidates yet. Add candidates from a role to generate their join codes.
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-2xl border border-border">
          {sorted.map((c, i) => {
            const decided = ["completed", "advanced", "rejected"].includes(c.status);
            const row = (
              <div className="flex items-center justify-between px-5 py-3.5">
                <div className="min-w-0">
                  <span className="font-medium">{c.name ?? "Candidate"}</span>
                  <span className="ml-3 text-sm text-muted">
                    {roleTitle.get(c.role_id) ?? "—"}
                  </span>
                </div>
                <span className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      statusPill[c.status] ?? "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {statusLabel[c.status] ?? c.status}
                  </span>
                  {decided && (
                    <span className="text-sm font-medium text-accent-soft">View →</span>
                  )}
                </span>
              </div>
            );
            return (
              <div
                key={c.id}
                className={i > 0 ? "border-t border-border/60" : ""}
              >
                {decided ? (
                  <Link
                    href={`/candidates/${c.id}`}
                    className="block transition-colors hover:bg-card/60"
                  >
                    {row}
                  </Link>
                ) : (
                  row
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
