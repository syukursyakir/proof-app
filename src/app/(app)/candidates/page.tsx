import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase-server";
import { Reveal } from "@/components/motion";
import { computeComposite } from "@/lib/composite";
import { getDictionary, isSupportedLocale } from "@/lib/i18n";
import KanbanBoard, { type KanbanCandidate } from "@/components/KanbanBoard";
import type { Role } from "@/lib/types";

export const dynamic = "force-dynamic";

type CandRow = {
  id: string;
  role_id: string;
  name: string | null;
  status: string;
  aptitude_score: number | null;
  aptitude_max: number | null;
  skills_score: number | null;
  skills_max: number | null;
};

export default async function CandidatesPage() {
  const sb = await supabaseServer();

  const cookieStore = await cookies();
  const rawLocale = cookieStore.get("clarion-locale")?.value ?? "en";
  const siteLocale = isSupportedLocale(rawLocale) ? rawLocale : "en";
  const sd = await getDictionary(siteLocale);
  const e = sd.employer;

  const { data: roleRows } = await sb.from("roles").select("id, title");
  const roles = (roleRows as Pick<Role, "id" | "title">[]) ?? [];
  const roleTitle = new Map(roles.map((r) => [r.id, r.title]));

  let rows: CandRow[] = [];
  const interviewScores: Record<string, number[]> = {};
  if (roles.length > 0) {
    const { data } = await sb
      .from("candidates")
      .select(
        "id, role_id, name, status, aptitude_score, aptitude_max, skills_score, skills_max",
      )
      .in("role_id", roles.map((r) => r.id))
      .order("created_at", { ascending: false });
    rows = (data as CandRow[]) ?? [];

    const ids = rows.map((c) => c.id);
    if (ids.length) {
      const { data: vrows } = await sb
        .from("verdicts")
        .select("candidate_id, per_criterion")
        .in("candidate_id", ids);
      for (const v of vrows ?? []) {
        interviewScores[v.candidate_id as string] = (
          (v.per_criterion as { score: number }[]) ?? []
        ).map((c) => c.score);
      }
    }
  }

  const boarded = rows.filter((c) =>
    ["completed", "advanced", "rejected"].includes(c.status),
  );
  const inProgress = rows.length - boarded.length;

  const cards: KanbanCandidate[] = boarded.map((c) => {
    const comp = computeComposite({
      interviewScores: interviewScores[c.id] ?? [],
      skillsScore: c.skills_score,
      skillsMax: c.skills_max,
      aptitudeScore: c.aptitude_score,
      aptitudeMax: c.aptitude_max,
    });
    return {
      id: c.id,
      name: c.name ?? "Candidate",
      roleTitle: roleTitle.get(c.role_id) ?? "—",
      status: c.status as KanbanCandidate["status"],
      score: comp ? Math.round(comp.composite) : null,
      band: comp ? comp.band : null,
    };
  });

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-8 py-10">
      <Reveal>
        <h1 className="text-3xl font-semibold tracking-tight">{e.candsP.title}</h1>
        <p className="mt-2 text-muted">
          {e.candsP.subtitle}
          {inProgress > 0 && (
            <span className="ml-1">
              {inProgress} {e.candsP.stillCompleting}
            </span>
          )}
        </p>
      </Reveal>

      {cards.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted">
          {e.candsP.noCompleted}
        </div>
      ) : (
        <KanbanBoard initial={cards} />
      )}
    </main>
  );
}
