import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { resolveToken } from "@/lib/candidateToken";
import InterviewRoom from "@/components/InterviewRoom";
import AssessmentFlow from "@/components/AssessmentFlow";
import CandidateStatus from "@/components/CandidateStatus";
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

  // Already finished? Show their status — don't let them redo, and close the
  // loop (being ghosted after finishing is the #1 candidate complaint).
  if (["completed", "advanced", "rejected"].includes(candidate.status)) {
    return (
      <CandidateStatus
        status={candidate.status as "completed" | "advanced" | "rejected"}
        orgName={orgName}
        roleTitle={role.title}
        rubric={role.rubric ?? []}
        token={token}
      />
    );
  }

  const testMcq = (role.test_mcq as TestQuestion[] | null) ?? [];
  const skillsQs = role.test_questions ?? [];

  // Pre-interview written sections are gated by the role's test_enabled toggle.
  const { data: candRow } = await supabaseAdmin()
    .from("candidates")
    .select("aptitude_score, skills_score")
    .eq("id", candidate.id)
    .single();
  const aptitudeDone =
    candRow?.aptitude_score !== null && candRow?.aptitude_score !== undefined;
  const skillsDone =
    candRow?.skills_score !== null && candRow?.skills_score !== undefined;

  const needAptitude = role.test_enabled && testMcq.length > 0 && !aptitudeDone;
  const needSkills = role.test_enabled && skillsQs.length > 0 && !skillsDone;

  // Resume is asked for at the start, per the role's resume_mode, unless the
  // candidate already submitted one. It's context for the employer, never scored.
  const resumeMode = role.resume_mode ?? "off";
  const needResume = resumeMode !== "off" && !candidate.resume_url;

  if (needAptitude || needSkills || needResume) {
    // Strip the answer key — the candidate's browser must never receive `correct`.
    const safeMcq = needAptitude
      ? testMcq.map(({ correct: _correct, ...q }) => q)
      : [];
    return (
      <AssessmentFlow
        token={token}
        roleTitle={role.title}
        orgName={orgName}
        aptitudeQuestions={safeMcq}
        skillsQuestions={needSkills ? skillsQs : []}
        interviewQuestionCount={role.interview_questions?.length ?? 5}
        resumeMode={needResume ? (resumeMode as "optional" | "required") : "off"}
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
      terms={role.terms ?? []}
    />
  );
}
