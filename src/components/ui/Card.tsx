import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

// Replaces the copy-pasted "rounded-2xl border border-border bg-card/50 p-6"
// pattern duplicated across 12+ files. `tint="accent"` covers the highlight-card
// species seen in RolePicker's VoiceCard and CandidatePanel's share-code box.
// `tint="warning"` covers the awaiting-review highlight on dashboard stat cards.
type CardProps = {
  padding?: "sm" | "md" | "lg";
  tint?: 30 | 40 | 50 | 60 | 70 | "accent" | "warning";
  radius?: "xl" | "2xl";
  lifted?: boolean;
  border?: "solid" | "dashed";
  className?: string;
} & HTMLAttributes<HTMLDivElement>;

const paddingClass: Record<NonNullable<CardProps["padding"]>, string> = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

const radiusClass: Record<NonNullable<CardProps["radius"]>, string> = {
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
};

// Literal strings, not template interpolation — Tailwind's JIT scanner only
// picks up class names it can find verbatim in source.
const tintClass: Record<NonNullable<CardProps["tint"]>, string> = {
  30: "bg-card/30",
  40: "bg-card/40",
  50: "bg-card/50",
  60: "bg-card/60",
  70: "bg-card/70",
  accent: "border-accent/30 bg-accent/5",
  warning: "border-accent-warm/40 bg-accent-warm/10",
};

const tintedBorderTints: ReadonlySet<CardProps["tint"]> = new Set(["accent", "warning"]);

export default function Card({
  padding = "md",
  tint = 50,
  radius = "2xl",
  lifted = false,
  border = "solid",
  className,
  ...props
}: CardProps) {
  const borderAndTintClass = tintedBorderTints.has(tint)
    ? cn("border", tintClass[tint])
    : cn(
        "border",
        border === "dashed" ? "border-dashed border-border" : "border-border",
        tintClass[tint],
      );
  return (
    <div
      className={cn(
        borderAndTintClass,
        radiusClass[radius],
        paddingClass[padding],
        lifted && "lift",
        className,
      )}
      {...props}
    />
  );
}
