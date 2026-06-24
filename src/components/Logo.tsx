/* eslint-disable @next/next/no-img-element */

// The Clarion brand mark (icon.svg) + optional wordmark. Used in nav, sidebar,
// and the candidate-facing headers.
export default function Logo({
  withText = true,
  size = 34,
  className = "",
}: {
  withText?: boolean;
  size?: number;
  className?: string;
}) {
  return (
    <span className={`flex items-center gap-2.5 text-lg font-semibold tracking-tight ${className}`}>
      <img
        src="/icon.svg"
        alt="Clarion"
        width={size}
        height={size}
        className="rounded-md"
        style={{ width: size, height: size }}
      />
      {withText && <span>Clarion</span>}
    </span>
  );
}
