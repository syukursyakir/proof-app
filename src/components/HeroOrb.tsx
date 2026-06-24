"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { VoiceOrbState } from "@/components/VoiceOrb";

// Lazy-load the Three.js orb so it never weighs down the landing's first paint.
const VoiceOrb = dynamic(() => import("@/components/VoiceOrb"), {
  ssr: false,
  loading: () => (
    <div className="orb-glow orb-pulse h-44 w-44 rounded-full bg-[radial-gradient(circle_at_35%_30%,#b9aefff2,#6d5ef8_45%,#3b2fb0_100%)]" />
  ),
});

// Gently cycles listening ↔ speaking so the hero orb feels alive (like an
// interviewer mid-conversation), without any real audio.
export default function HeroOrb({ size = 300 }: { size?: number }) {
  const [state, setState] = useState<VoiceOrbState>("speaking");
  useEffect(() => {
    const id = setInterval(
      () => setState((s) => (s === "speaking" ? "listening" : "speaking")),
      2800,
    );
    return () => clearInterval(id);
  }, []);
  return <VoiceOrb state={state} size={size} />;
}
