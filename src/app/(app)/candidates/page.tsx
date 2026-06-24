import Link from "next/link";
import { supabaseServer } from "@/lib/supabase-server";
import { Reveal } from "@/components/motion";
import type { Candidate, Role } from "@/lib/types";

export const dynamic = "force-dynamic";

// Pipeline columns, left → right.
const COLUMNS: { key: Candidate["status"]; label: string; accent: string }[] = [
  { key: "invited", label: "Invited", accent: "bg-slate-400" },
  { key: "interviewing", label: "In progress", accent: "bg-amber-400" },
  { key: "completed", label: "Awaiting review", accent: "bg-blue-400" },
  { key: "advanced", label: "Advanced", accent: "bg-green-500" },
  { key: "rejected", label: "Rejected", accent: "bg-red-400" },
];

const recColor: Record<string, string> = {
  advance: "bg-green-100 text-green-700",
  "lean advance": "bg-green-100 text-green-700",
  "lean reject": "bg-red-100 text-red-700",
  reject: "bg-red-100 text-red-700",
};

export default async function CandidatesPage() {
  const sb = await supabaseServer();

  const { data: roleRows } = await sb.from("roles").select("id, title");
  const roles = (roleRows as Pick<Role, "id" | "title">[]) ?? [];
  const roleTitle = new Map(roles.map((r) => [r.id, r.title]));

  let candidates: Candidate[] = [];
  const summaries: Record<string, { avg: number; recommendation: string }> = {};
  if (roles.length > 0) {
    const { data } = await sb
      .from("candidates")
      .select("id, role_id, name, status, created_at")
      .in("role_id", roles.map((r) => r.id))
      .order("created_at", { ascending: false });
    candidates = (data as Candidate[]) ?? [];

    // AI ratings: average each candidate's verdict criterion scores.
    const ids = candidates.map((c) => c.id);
    if (ids.length) {
      const { data: vrows } = await sb
        .from("verdicts")
        .select("candidate_id, overall, per_criterion")
        .in("candidate_id", ids);
      for (const v of vrows ?? []) {
        const pc = (v.per_criterion as { score: number }[]) ?? [];
        const avg = pc.length
          ? pc.reduce((s, c) => s + (c.score || 0), 0) / pc.length
          : 0;
        summaries[v.candidate_id as string] = {
          avg,
          recommendation:
            (v.overall as { recommendation?: string })?.recommendation ?? "",
        };
      }
    }
  }

  const byStatus = (status: string) =>
    candidates.filter((c) => c.status === status);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-8 py-10">
      <Reveal>
        <h1 className="text-3xl font-semibold tracking-tight">Candidates</h1>
        <p className="mt-2 text-muted">
          Your whole hiring pipeline at a glance — with Clarion&apos;s AI rating on
          each candidate who&apos;s been assessed.
        </p>
      </Reveal>

      {candidates.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted">
          No candidates yet. Open a role to add candidates and generate their join
          codes.
        </div>
      ) : (
        <div className="mt-8 flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => {
            const items = byStatus(col.key);
            return (
              <div key={col.key} className="w-72 shrink-0">
                <div className="mb-3 flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${col.accent}`} />
                  <h2 className="text-sm font-semibold">{col.label}</h2>
                  <span className="tnum rounded-full bg-card px-2 py-0.5 text-xs text-muted">
                    {items.length}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {items.length === 0 && (
                    <div className="rounded-xl border border-dashed border-border/70 p-4 text-center text-xs text-muted">
                      —
                    </div>
                  )}
                  {items.map((c) => {
                    const s = summaries[c.id];
                    const decided = ["completed", "advanced", "rejected"].includes(
                      c.status,
                    );
                    const card = (
                      <div className="lift rounded-xl border border-border bg-card/50 p-4">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate font-medium">
                            {c.name ?? "Candidate"}
                          </span>
                          {s && (
                            <span className="tnum shrink-0 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent-soft">
                              {s.avg.toFixed(1)}/5
                            </span>
                          )}
                        </div>
                        <p className="mt-1 truncate text-xs text-muted">
                          {roleTitle.get(c.role_id) ?? "—"}
                        </p>
                        {s?.recommendation && (
                          <span
                            className={`mt-3 inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                              recColor[s.recommendation] ?? "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {s.recommendation}
                          </span>
                        )}
                      </div>
                    );
                    return decided ? (
                      <Link key={c.id} href={`/candidates/${c.id}`} className="block">
                        {card}
                      </Link>
                    ) : (
                      <div key={c.id}>{card}</div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
