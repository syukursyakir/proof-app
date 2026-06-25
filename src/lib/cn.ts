// Tiny classname-join helper — no clsx/cva dependency needed for this codebase's
// conditional-class needs (no two components apply conflicting Tailwind utilities
// to the same element, so no conflict-resolution logic is required).
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
