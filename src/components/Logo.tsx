/* eslint-disable @next/next/no-img-element */

// The Clarion brand mark (icon.svg) + optional wordmark. Used in nav, sidebar,
// and the candidate-facing headers.
export default function Logo({
  withText = true,
  size = 24,
  className = "",
}: {
  withText?: boolean;
  size?: number;
  className?: string;
}) {
  return (
    <span className={`flex items-center gap-2 font-semibold tracking-tight ${className}`}>
      <img
        src="/icon.svg"
        alt="Clarion"
        width={size}
        height={size}
        className="rounded-md"
        // The mark is violet by default; shift its hue toward the navy palette.
        style={{
          width: size,
          height: size,
          filter: "hue-rotate(-34deg) saturate(0.62) brightness(0.92)",
        }}
      />
      {withText && <span>Clarion</span>}
    </span>
  );
}
