import { cn } from "@/lib/cn";

// The house loading-dot convention — extracted from RolePicker's original
// "suggesting skills…" indicator. Reuses the existing `.orb-pulse` CSS class
// (globals.css), shared with the voice orb's idle animation incidentally,
// not conceptually — don't rename the class, but don't assume editing the
// voice orb's feel is safe without checking every Spinner usage too.
export default function Spinner({
  size = "sm",
  className,
}: {
  size?: "xs" | "sm";
  className?: string;
}) {
  const sizeClass = size === "xs" ? "h-2.5 w-2.5" : "h-3 w-3";
  return (
    <span
      aria-hidden
      className={cn("orb-pulse rounded-full bg-accent", sizeClass, className)}
    />
  );
}
