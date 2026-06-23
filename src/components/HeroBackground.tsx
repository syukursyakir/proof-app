"use client";

import { motion, useReducedMotion } from "framer-motion";

// Ambient aurora: two slow-drifting glow orbs + a faint grain overlay.
// Only transform/opacity animate; disabled under prefers-reduced-motion.
export default function HeroBackground() {
  const reduce = useReducedMotion();
  const drift = (x: number[], y: number[], dur: number) =>
    reduce ? undefined : { x, y };

  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <motion.div
        className="absolute left-[12%] top-[-12%] h-[42vw] w-[42vw] rounded-full bg-accent/20 blur-[110px]"
        animate={drift([0, 40, 0], [0, 30, 0], 14)}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-[8%] top-[6%] h-[36vw] w-[36vw] rounded-full bg-[#8b7cff]/20 blur-[120px]"
        animate={drift([0, -36, 0], [0, 44, 0], 18)}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="grain absolute inset-0" />
    </div>
  );
}
