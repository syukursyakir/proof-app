import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

// Replaces the copy-pasted "w-full rounded-lg border border-border bg-background
// px-3 py-2 text-sm outline-none focus:border-accent" pattern across
// AssessmentForm/RolePicker/SkillsTest/SettingsForm.
type InputProps = {
  label?: string;
  error?: string;
  className?: string;
} & InputHTMLAttributes<HTMLInputElement>;

export default function Input({ label, error, className, id, ...props }: InputProps) {
  const input = (
    <input
      id={id}
      className={cn(
        "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
  if (!label && !error) return input;
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
      {input}
      {error && <p className="mt-1 text-xs text-accent-clay">{error}</p>}
    </div>
  );
}
