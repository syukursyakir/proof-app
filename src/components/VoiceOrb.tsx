"use client";

import { useEffect, useRef } from "react";

// Lightweight canvas orb. Radius/glow driven by live output amplitude (0-1).
export default function VoiceOrb({
  getLevel,
  active,
  size = 320,
}: {
  getLevel: () => number;
  active: boolean;
  size?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    let raf = 0;
    let t = 0;
    let smooth = 0;

    const draw = () => {
      t += 0.02;
      const raw = active ? Math.min(1, Math.max(0, getLevel())) : 0;
      smooth += (raw - smooth) * 0.2;
      const base = size * 0.2;
      const idle = Math.sin(t) * (size * 0.012);
      const r = base + idle + smooth * size * 0.17;

      ctx.clearRect(0, 0, size, size);

      // outer glow
      const glow = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 2);
      glow.addColorStop(0, `rgba(139,124,255,${0.45 + smooth * 0.5})`);
      glow.addColorStop(0.5, "rgba(109,94,248,0.18)");
      glow.addColorStop(1, "rgba(109,94,248,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 2, 0, Math.PI * 2);
      ctx.fill();

      // core
      const core = ctx.createRadialGradient(
        cx - r * 0.3,
        cy - r * 0.3,
        r * 0.1,
        cx,
        cy,
        r,
      );
      core.addColorStop(0, "#d6d0ff");
      core.addColorStop(0.5, "#6d5ef8");
      core.addColorStop(1, "#3b2fb0");
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [getLevel, active, size]);

  return <canvas ref={ref} style={{ width: size, height: size }} />;
}
