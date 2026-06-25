import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

// Standardized icon-only action button (close, copy, sign-out, etc.) — h-9 w-9,
// rounded-full. NOT for MCQ radio circles, calibration score buttons, or the
// landing play button — those are custom selection widgets, not icon actions.
type IconButtonProps = {
  "aria-label": string;
  size?: "sm" | "md";
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const sizeClass: Record<NonNullable<IconButtonProps["size"]>, string> = {
  sm: "h-7 w-7",
  md: "h-9 w-9",
};

export default function IconButton({
  size = "md",
  className,
  ...props
}: IconButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-full text-muted transition-colors hover:bg-card hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
        sizeClass[size],
        className,
      )}
      {...props}
    />
  );
}
