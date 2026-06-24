import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";
import AssessmentForm from "@/components/AssessmentForm";
import CandidatePanel from "@/components/CandidatePanel";
import DeleteButton from "@/components/DeleteButton";
import { genCode } from "@/lib/candidateToken";
import type { Candidate, Role } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function RolePage({
  params,
}: {
  params: Promise<{ roleId: string }>;
}) {
  const { roleId } = await params;
  const supa = await supabaseServer();
  const { data, error } = await supa
    .from("roles")
    .select("*")
    .eq("id", roleId)
    .single();

  if (error || !data) notFound();
  const role = data as Role;

  // Backfill an open join code for roles created before this feature.
  if (!role.join_code) {
    const code = genCode();
    await supa.from("roles").update({ join_code: code }).eq("id", role.id);
    role.join_code = code;
  }

  const { data: candData } = await supa
    .from("candidates")
    .select("*")
    .eq("role_id", roleId)
    .order("created_at", { ascending: false });
  const candidates = (candData as Candidate[]) ?? [];

  // Verdict summaries (avg score + recommendation) for at-a-glance ranking.
  const summaries: Record<string, { avg: number; recommendation: string }> = {};
  const candIds = candidates.map((c) => c.id);
  if (candIds.length) {
    const { data: vrows } = await supa
      .from("verdicts")
      .select("candidate_id, overall, per_criterion")
      .in("candidate_id", candIds);
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

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-8 py-10">
      <div className="flex items-center justify-between">
        <Link href="/roles" className="text-sm text-muted hover:text-foreground">
          ← Roles
        </Link>
        <DeleteButton
          endpoint="/api/roles"
          id={role.id}
          redirectTo="/roles"
          label="Delete role"
          confirmLabel="Delete role + all candidates?"
        />
      </div>
      <div className="mt-6">
        <AssessmentForm
          mode="edit"
          roleId={role.id}
          initial={{
            title: role.title,
            description_raw: role.description_raw,
            occupation: role.occupation,
            rubric: role.rubric ?? [],
            test_questions: role.test_questions ?? [],
            test_mcq: role.test_mcq ?? null,
            interview_questions: role.interview_questions ?? [],
            terms: role.terms ?? [],
            test_enabled: role.test_enabled,
          }}
        />
        <CandidatePanel
          roleId={role.id}
          roleTitle={role.title}
          roleCode={role.join_code ?? null}
          candidates={candidates}
          summaries={summaries}
        />
      </div>
    </main>
  );
}
