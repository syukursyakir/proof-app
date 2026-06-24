import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase";
import VerdictView from "@/components/VerdictView";
import DeleteButton from "@/components/DeleteButton";
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
    proctor_flags?: {
      share_lost?: boolean;
      tab_switches?: number;
      not_full_screen?: boolean;
    } | null;
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

  let resumeUrl: string | null = null;
  if (candidate.resume_url) {
    const { data: signed } = await supabaseAdmin()
      .storage.from("recordings")
      .createSignedUrl(candidate.resume_url, 3600);
    resumeUrl = signed?.signedUrl ?? null;
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-8 py-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-sm text-muted">
          <Link href="/candidates" className="hover:text-foreground">
            ← Candidates
          </Link>
          <Link href={`/roles/${candidate.role_id}`} className="hover:text-foreground">
            View role
          </Link>
        </div>
        <div className="flex items-center gap-3">
          {resumeUrl && (
            <a
              href={resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-border px-4 py-2 text-sm font-medium text-muted hover:border-accent hover:text-foreground"
            >
              📄 Resume
            </a>
          )}
          <DeleteButton
            endpoint="/api/candidates"
            id={candidate.id}
            redirectTo="/candidates"
            label="Delete candidate"
            confirmLabel="Delete candidate?"
          />
        </div>
      </div>

      {Array.isArray(candidate.resume_claims) &&
        candidate.resume_claims.length > 0 && (
          <div className="mb-6 rounded-xl border border-border bg-card/50 p-4 text-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Resume claims probed in the interview
            </p>
            <ul className="mt-2 space-y-1">
              {candidate.resume_claims.map((c, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 text-accent-soft">•</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 border-t border-border/60 pt-2 text-xs text-muted">
              Clarion asked the candidate to substantiate these resume claims
              live. The resume itself is <span className="text-foreground">not
              scored</span> — only what they demonstrated in the interview.
            </p>
          </div>
        )}

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
