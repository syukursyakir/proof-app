import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

// Same radius/border/focus convention as Input at every size — only padding
// and min-height vary, encoding the three real content-length tiers found in
// the app: sm = rubric anchors (AssessmentForm), md = work-sample answers
// (SkillsTest), lg = full interview answers (TextInterview). All three share
// rounded-lg now — TextInterview previously drifted to rounded-xl with no
// stated reason.
type TextareaProps = {
  label?: string;
  error?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
} & TextareaHTMLAttributes<HTMLTextAreaElement>;

const sizeClass: Record<NonNullable<TextareaProps["size"]>, string> = {
  sm: "px-3 py-2 min-h-16",
  md: "px-3 py-2 min-h-28",
  lg: "px-4 py-3 min-h-40",
};

export default function Textarea({
  label,
  error,
  size = "sm",
  className,
  id,
  ...props
}: TextareaProps) {
  const textarea = (
    <textarea
      id={id}
      className={cn(
        "w-full rounded-lg border border-border bg-background text-sm outline-none focus:border-accent disabled:cursor-not-allowed disabled:opacity-50",
        sizeClass[size],
        className,
      )}
      {...props}
    />
  );
  if (!label && !error) return textarea;
  return (
    <div>
      {label && (
        <label
          htmlFor={id}
          className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted"
        >
          {label}
        </label>
      )}
      {textarea}
      {error && <p className="mt-1 text-xs text-accent-clay">{error}</p>}
    </div>
  );
}
