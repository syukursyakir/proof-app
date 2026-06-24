import { jsonChat } from "@/lib/openai";
import { SCORE_SYSTEM } from "@/lib/prompts";
import { supabaseAdmin } from "@/lib/supabase";
import { groundQuotes, clampScore } from "@/lib/verifyQuotes";
import type { CriterionVerdict, Criterion } from "@/lib/types";

type ScoreResult = {
  overall: { summary: string; recommendation: string; integrity_flag?: boolean };
  per_criterion: CriterionVerdict[];
};

const N_SAMPLES = 3;
// A transcript shorter than this almost certainly has no real candidate content.
const MIN_TRANSCRIPT_CHARS = 80;

export type ScoreOutcome =
  | { ok: true; verdictId: string }
  | { ok: false; reason: "no-transcript" | "too-short" | "no-rubric" | "model" | "error" };

// Scores a candidate's interview transcript against the role rubric using the
// service-role client. Idempotent-friendly: callers decide whether to overwrite.
// Used by both the employer "Generate verdict" action and auto-scoring on
// interview completion.
export async function scoreCandidate(candidateId: string): Promise<ScoreOutcome> {
  try {
    const admin = supabaseAdmin();

    const { data: candidate } = await admin
      .from("candidates")
      .select("id, org_id, role_id")
      .eq("id", candidateId)
      .single();
    if (!candidate) return { ok: false, reason: "error" };

    const { data: role } = await admin
      .from("roles")
      .select("rubric, terms")
      .eq("id", candidate.role_id)
      .single();

    const { data: transcript } = await admin
      .from("transcripts")
      .select("full_text")
      .eq("candidate_id", candidateId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const fullText: string = transcript?.full_text ?? "";
    if (!fullText.trim()) return { ok: false, reason: "no-transcript" };

    // Guard against scoring an empty/near-empty interview (e.g. candidate never
    // really spoke) — produces fabricated, ungrounded scores otherwise.
    const candidateText = fullText
      .split("\n")
      .filter((l) => /^candidate:/i.test(l.trim()))
      .join(" ")
      .replace(/^candidate:/i, "")
      .trim();
    if (candidateText.replace(/candidate:/gi, "").trim().length < MIN_TRANSCRIPT_CHARS) {
      return { ok: false, reason: "too-short" };
    }

    const rubric = (role?.rubric as Criterion[] | null) ?? [];
    const terms = (role?.terms as string[] | null) ?? [];
    const glossary = terms.length
      ? `\n\nGlossary — terms relevant to this role. Speech-to-text may have garbled them in the transcript; interpret phonetically-close text as the intended term (e.g. "cloud code" → "Claude Code") when judging, but keep any verbatim quotes exactly as they appear in the transcript:\n${terms.map((t) => `- ${t}`).join("\n")}`
      : "";
    const userMsg = `Rubric:\n${JSON.stringify(rubric)}${glossary}\n\n<<<TRANSCRIPT>>>\n${fullText}\n<<<END_TRANSCRIPT>>>`;

    const runs = await Promise.all(
      Array.from({ length: N_SAMPLES }, () =>
        jsonChat<ScoreResult>(SCORE_SYSTEM, userMsg, { temperature: 0.3 }).catch(
          () => null,
        ),
      ),
    );
    const valid = runs.filter(Boolean) as ScoreResult[];
    if (!valid.length) return { ok: false, reason: "model" };

    const rubricNames = rubric.map((c) => c.name);
    const names =
      rubricNames.length > 0
        ? rubricNames
        : (valid[0].per_criterion ?? []).map((c) => c.name);
    if (names.length === 0) return { ok: false, reason: "no-rubric" };

    const per: CriterionVerdict[] = names.map((name) => {
      const entries = valid
        .map((r) => (r.per_criterion ?? []).find((c) => c.name === name))
        .filter(Boolean) as CriterionVerdict[];
      const scores = entries.map((e) => clampScore(e.score)).sort((a, b) => a - b);
      const median = scores.length ? scores[Math.floor(scores.length / 2)] : 1;
      const range = scores.length ? scores[scores.length - 1] - scores[0] : 0;
      const rep =
        entries.length > 0
          ? entries.reduce((best, e) =>
              Math.abs(clampScore(e.score) - median) <
              Math.abs(clampScore(best.score) - median)
                ? e
                : best,
            )
          : null;
      return {
        name,
        score: median,
        justification: rep?.justification ?? "",
        quotes: rep?.quotes ?? [],
        low_confidence: range >= 2,
      };
    });

    const { grounded } = groundQuotes(per, fullText);

    const recCounts: Record<string, number> = {};
    for (const r of valid) {
      const rec = r.overall?.recommendation;
      if (rec) recCounts[rec] = (recCounts[rec] ?? 0) + 1;
    }
    const recommendation =
      Object.entries(recCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ??
      valid[0].overall?.recommendation ??
      "lean advance";
    const overall = {
      summary: valid[0].overall?.summary ?? "",
      recommendation,
      integrity_flag: valid.some((r) => r.overall?.integrity_flag),
    };

    // Insert the new verdict first, then remove older ones — so a failure never
    // leaves the candidate with no verdict at all.
    const { data: inserted, error } = await admin
      .from("verdicts")
      .insert({
        candidate_id: candidateId,
        org_id: candidate.org_id,
        overall,
        per_criterion: grounded,
      })
      .select("id")
      .single();
    if (error || !inserted) return { ok: false, reason: "error" };
    await admin
      .from("verdicts")
      .delete()
      .eq("candidate_id", candidateId)
      .neq("id", inserted.id);

    return { ok: true, verdictId: inserted.id as string };
  } catch (e) {
    console.error("scoreCandidate error", e);
    return { ok: false, reason: "error" };
  }
}
