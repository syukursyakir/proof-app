import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase";
import VerdictView from "@/components/VerdictView";
import type { Candidate, Transcript, Verdict } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CandidatePage({
  params,
}: {
  params: Promise<{ candidateId: string }>;
}) {
  const { candidateId } = await params;
  const supa = await supabaseServer();

  const { data: cand } = await supa
    .from("candidates")
    .select("*")
    .eq("id", candidateId)
    .single();
  if (!cand) notFound();
  const candidate = cand as Candidate & {
    aptitude_score?: number | null;
    aptitude_max?: number | null;
    skills_score?: number | null;
    skills_max?: number | null;
    skills_answers?: {
      qa: { question: string; answer: string }[];
      per_question: { score: number; justification: string }[];
      overall: string | null;
    } | null;
    proctor_recording_url?: string | null;
    proctor_flags?: { share_lost?: boolean; tab_switches?: number } | null;
  };

  const { data: transcript } = await supa
    .from("transcripts")
    .select("*")
    .eq("candidate_id", candidateId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: verdict } = await supa
    .from("verdicts")
    .select("*")
    .eq("candidate_id", candidateId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: rating } = await supa
    .from("human_ratings")
    .select("per_criterion")
    .eq("candidate_id", candidateId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const humanRating =
    (rating?.per_criterion as { name: string; score: number }[]) ?? null;

  const t = transcript as Transcript | null;

  // Recordings live in a private bucket; mint a short-lived signed URL for playback.
  // (Ownership is already enforced: RLS returned this transcript to the employer.)
  let recordingUrl: string | null = null;
  if (t?.recording_url) {
    if (t.recording_url.startsWith("http")) {
      recordingUrl = t.recording_url; // legacy public URL
    } else {
      const { data: signed } = await supabaseAdmin()
        .storage.from("recordings")
        .createSignedUrl(t.recording_url, 3600);
      recordingUrl = signed?.signedUrl ?? null;
    }
  }

  let proctorUrl: string | null = null;
  if (candidate.proctor_recording_url) {
    const { data: signed } = await supabaseAdmin()
      .storage.from("recordings")
      .createSignedUrl(candidate.proctor_recording_url, 3600);
    proctorUrl = signed?.signedUrl ?? null;
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-8 py-10">
      <div className="mb-6 flex items-center gap-4 text-sm text-muted">
        <Link href="/candidates" className="hover:text-foreground">
          ← Candidates
        </Link>
        <Link href={`/roles/${candidate.role_id}`} className="hover:text-foreground">
          View role
        </Link>
      </div>
      <VerdictView
        candidate={candidate}
        verdict={(verdict as Verdict | null) ?? null}
        fullText={t?.full_text ?? null}
        recordingUrl={recordingUrl}
        proctorUrl={proctorUrl}
        appealRequested={!!candidate.appeal_requested_at}
        humanRating={humanRating}
      />
    </main>
  );
}
