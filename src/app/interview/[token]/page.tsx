import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { resolveToken } from "@/lib/candidateToken";
import InterviewRoom from "@/components/InterviewRoom";
import AptitudeGate from "@/components/AptitudeGate";
import type { Role, TestQuestion } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function InterviewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const candidate = await resolveToken(token);

  if (!candidate) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <h1 className="text-2xl font-semibold">This interview link is invalid or expired</h1>
        <p className="mt-3 max-w-md text-muted">
          Ask the employer for a new link, or enter your join code.
        </p>
        <Link
          href="/join"
          className="mt-6 rounded-full bg-accent px-6 py-2.5 font-medium text-white hover:bg-accent-soft"
        >
          Enter a join code
        </Link>
      </div>
    );
  }

  const { data: roleData } = await supabaseAdmin()
    .from("roles")
    .select("*, organizations(name)")
    .eq("id", candidate.role_id)
    .single();
  if (!roleData) notFound();
  const role = roleData as Role & { organizations?: { name: string } | null };
  const orgName = (role.organizations as { name?: string } | null)?.name ?? null;
  const testMcq = (role.test_mcq as TestQuestion[] | null) ?? null;
  const hasAptitude = role.test_enabled && testMcq && testMcq.length > 0;

  // Check if the candidate already completed the aptitude test.
  const { data: candRow } = await supabaseAdmin()
    .from("candidates")
    .select("aptitude_score")
    .eq("id", candidate.id)
    .single();
  const aptitudeDone = candRow?.aptitude_score !== null && candRow?.aptitude_score !== undefined;

  if (hasAptitude && !aptitudeDone) {
    return (
      <AptitudeGate
        token={token}
        roleTitle={role.title}
        orgName={orgName}
        questions={testMcq}
        interviewQuestionCount={role.interview_questions?.length ?? 5}
      />
    );
  }

  return (
    <InterviewRoom
      token={token}
      candidateName={candidate.name ?? "Candidate"}
      roleTitle={role.title}
      questions={role.interview_questions ?? []}
      rubric={role.rubric ?? []}
      agentConfigured={!!process.env.ELEVENLABS_AGENT_ID}
      orgName={orgName}
    />
  );
}
