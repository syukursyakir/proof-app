import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import Spinner from "@/components/ui/Spinner";

// The in-app/form button — every authenticated app screen and candidate-facing
// form. NOT for the public marketing hero: motion.tsx's PrimaryButton /
// SecondaryButton / MagneticButton own that tier (Link-based, shimmer/magnetic
// hover). This one is button-based and supports the loading state real forms need.
type ButtonProps = {
  variant?: "primary" | "secondary" | "danger" | "positive" | "ghost";
  size?: "sm" | "md";
  loading?: boolean;
  loadingText?: string;
  children: ReactNode;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const variantClass: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-accent text-white hover:bg-accent-soft shadow-[var(--shadow-button-primary)]",
  secondary: "border border-border text-foreground hover:border-accent",
  danger:
    "border border-border text-muted hover:border-accent-clay hover:text-accent-clay",
  // "positive"/"danger" are the affirm/reject pair for triage actions (e.g.
  // advance/reject a candidate) — same shape, accent-sage vs accent-clay, so
  // the color-coding that already existed (raw green/red) survives the
  // token cleanup instead of flattening into one neutral primary button.
  positive: "bg-accent-sage text-white hover:opacity-90",
  ghost: "text-accent-soft hover:underline",
};

const sizeClass: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-2.5 text-sm",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  loadingText,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  // "ghost" is a text-only action link (e.g. "Add criterion", "Suggest more")
  // — it never takes button chrome/padding, just the pill button's text color.
  const isGhost = variant === "ghost";
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center gap-2 font-medium transition-colors focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        isGhost
          ? "text-sm"
          : "justify-center rounded-full focus-visible:ring-2 focus-visible:ring-accent/60",
        variantClass[variant],
        !isGhost && sizeClass[size],
        className,
      )}
      {...props}
    >
      {loading && <Spinner />}
      {loading ? loadingText ?? children : children}
    </button>
  );
}
