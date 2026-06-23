import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import InterviewRoom from "@/components/InterviewRoom";
import type { Candidate, Role } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function InterviewPage({
  params,
}: {
  params: Promise<{ candidateId: string }>;
}) {
  const { candidateId } = await params;
  const supa = supabaseAdmin();

  const { data: cand } = await supa
    .from("candidates")
    .select("*")
    .eq("id", candidateId)
    .single();
  if (!cand) notFound();
  const candidate = cand as Candidate;

  const { data: roleData } = await supa
    .from("roles")
    .select("*")
    .eq("id", candidate.role_id)
    .single();
  if (!roleData) notFound();
  const role = roleData as Role;

  return (
    <InterviewRoom
      candidateId={candidate.id}
      candidateName={candidate.name ?? "Candidate"}
      roleTitle={role.title}
      questions={role.interview_questions ?? []}
      rubric={role.rubric ?? []}
      agentConfigured={!!process.env.ELEVENLABS_AGENT_ID}
    />
  );
}
