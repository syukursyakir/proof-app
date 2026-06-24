"use client";

/**
 * LogoPulse — the Clarion brand mark as a live "loading-screen" visualizer.
 * A breathing logo at the centre with expanding sonar rings and a glow that
 * reacts to the AI's voice level. Lightweight (pure CSS + rAF), no WebGL.
 */

import { useEffect, useRef, useState } from "react";

export type LogoPulseState =
  | "connecting"
  | "listening"
  | "speaking"
  | "thinking"
  | "saving";

export default function LogoPulse({
  state = "listening",
  getLevel,
  size = 320,
}: {
  state?: LogoPulseState;
  getLevel?: () => number;
  size?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // Audio-reactive: smooth getLevel() into a --lvl CSS var (0..1).
  useEffect(() => {
    if (reduced || typeof getLevel !== "function") return;
    let raf = 0;
    let cur = 0;
    const tick = () => {
      let raw = 0;
      try {
        raw = getLevel() || 0;
      } catch {
        raw = 0;
      }
      raw = Math.max(0, Math.min(1, raw));
      cur += (raw - cur) * 0.2; // smoothing
      ref.current?.style.setProperty("--lvl", cur.toFixed(3));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [getLevel, reduced]);

  // Ring/breathe cadence by state: speaking = lively, listening = calm.
  const speed =
    state === "speaking" ? "1.5s" : state === "listening" ? "2.3s" : "3.2s";
  const ringsActive = !reduced && (state === "speaking" || state === "listening");

  const card = Math.round(size * 0.4);
  const logo = Math.round(card * 0.62);

  return (
    <div
      ref={ref}
      role="img"
      aria-label={`Clarion interviewer, ${state}`}
      className="relative flex items-center justify-center"
      style={
        {
          width: size,
          height: size,
          "--lvl": 0,
          "--spd": speed,
        } as React.CSSProperties
      }
    >
      {/* sonar rings */}
      {ringsActive &&
        [0, 1, 2].map((i) => (
          <span
            key={i}
            className="absolute rounded-full border border-accent/40"
            style={{
              width: size * 0.7,
              height: size * 0.7,
              animation: "clarionSonar var(--spd) ease-out infinite",
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}

      {/* voice-reactive glow */}
      <span
        aria-hidden
        className="absolute rounded-full"
        style={{
          width: size * 0.62,
          height: size * 0.62,
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--accent) 55%, transparent) 0%, transparent 68%)",
          transform: "scale(calc(0.82 + var(--lvl) * 0.55))",
          opacity: "calc(0.4 + var(--lvl) * 0.5)",
          filter: "blur(8px)",
          transition: "transform 80ms linear, opacity 80ms linear",
        }}
      />

      {/* breathing logo card */}
      <span
        className="relative flex items-center justify-center rounded-2xl bg-white shadow-[0_12px_44px_-8px_rgba(42,62,98,0.55)]"
        style={{
          width: card,
          height: card,
          animation: reduced
            ? undefined
            : "clarionBreathe var(--spd) ease-in-out infinite",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icon.svg"
          alt="Clarion"
          width={logo}
          height={logo}
          className="rounded-lg"
          style={{ width: logo, height: logo }}
        />
      </span>
    </div>
  );
}
