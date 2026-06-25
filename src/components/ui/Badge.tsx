import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

// Single source of truth for status coloring — replaces four independent,
// drifting implementations (VerdictView's statusPill/recColor/bandStyle,
// CandidatePanel's statusPill, CandidateStatus's badgeClass, KanbanBoard's
// scoreClasses), all of which used raw Tailwind palette colors instead of the
// brand's own tokens. Badge owns color only — callers still supply the
// localized label text, so no i18n plumbing moves.
//
// Three independent domains. Never merge them into one enum — they're
// different concepts that happen to share a color vocabulary:
//   - status: the candidate's lifecycle stage (src/lib/types.ts)
//   - recommendation: the AI's free-text verdict recommendation
//   - band: the composite score band (src/lib/composite.ts CompositeBand)
type CandidateStatusValue =
  | "invited"
  | "interviewing"
  | "completed"
  | "advanced"
  | "rejected";
type RecommendationValue =
  | "advance"
  | "lean advance"
  | "lean reject"
  | "reject";
type BandValue = "Strong" | "Recommended" | "Borderline" | "Not recommended";
type Tone = "neutral" | "info" | "positive" | "warning" | "negative";

type Size = "xs" | "sm" | "md";

type BadgeProps =
  | { domain: "status"; value: CandidateStatusValue; children: ReactNode; size?: Size; className?: string }
  | { domain: "recommendation"; value: RecommendationValue | string; children: ReactNode; size?: Size; className?: string }
  | { domain: "band"; value: BandValue | string | null; children: ReactNode; size?: Size; className?: string }
  | { tone: Tone; children: ReactNode; size?: Size; className?: string };

const statusTone: Record<CandidateStatusValue, Tone> = {
  invited: "neutral",
  interviewing: "warning",
  completed: "info",
  advanced: "positive",
  rejected: "negative",
};

const recommendationTone: Record<RecommendationValue, Tone> = {
  advance: "positive",
  "lean advance": "positive",
  "lean reject": "negative",
  reject: "negative",
};

const bandTone: Record<BandValue, Tone> = {
  Strong: "positive",
  Recommended: "info",
  Borderline: "warning",
  "Not recommended": "negative",
};

const toneClass: Record<Tone, string> = {
  neutral: "bg-card text-muted",
  info: "bg-accent/15 text-accent-soft",
  positive: "bg-accent-sage/15 text-accent-sage",
  warning: "bg-accent-warm/15 text-accent-warm-soft",
  negative: "bg-accent-clay/15 text-accent-clay",
};

const sizeClass: Record<Size, string> = {
  xs: "px-2 py-0.5 text-xs",
  sm: "px-3 py-1 text-xs",
  md: "px-3 py-1 text-sm",
};

function resolveTone(props: BadgeProps): Tone {
  if ("tone" in props) return props.tone;
  if (props.domain === "status") return statusTone[props.value];
  // recommendation is free text from the model — fall back to neutral for
  // anything outside the four known phrasings.
  if (props.domain === "recommendation")
    return recommendationTone[props.value as RecommendationValue] || "neutral";
  // band may carry legacy/unscored data as a bare string — fall back to neutral
  // for anything outside the known CompositeBand values.
  return (props.value && bandTone[props.value as BandValue]) || "neutral";
}

export default function Badge(props: BadgeProps) {
  const size = props.size ?? "sm";
  return (
    <span
      className={cn(
        "inline-block rounded-full font-medium",
        toneClass[resolveTone(props)],
        sizeClass[size],
        props.className,
      )}
    >
      {props.children}
    </span>
  );
}
