"use client";

import { useState } from "react";
import VoiceOrb, {
  type VoiceOrbShape,
  type VoiceOrbState,
} from "@/components/VoiceOrb";

const STATES: VoiceOrbState[] = [
  "idle",
  "listening",
  "speaking",
  "thinking",
  "error",
];
const SHAPES: VoiceOrbShape[] = ["blob", "ring", "knot", "particles", "wave"];

export default function PreviewPage() {
  const [state, setState] = useState<VoiceOrbState>("idle");
  const [shape, setShape] = useState<VoiceOrbShape>("blob");
  const [mic, setMic] = useState(false);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-10 bg-white p-8">
      <VoiceOrb
        state={state}
        shape={shape}
        enableMic={mic && state === "listening"}
        size={380}
      />

      <div className="flex flex-col items-center gap-4">
        <Row label="State" items={STATES} value={state} onPick={(v) => setState(v as VoiceOrbState)} />
        <Row label="Shape" items={SHAPES} value={shape} onPick={(v) => setShape(v as VoiceOrbShape)} />
        <label className="mt-2 flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={mic}
            onChange={(e) => setMic(e.target.checked)}
          />
          React to my mic (works when State = listening)
        </label>
      </div>
    </div>
  );
}

function Row({
  label,
  items,
  value,
  onPick,
}: {
  label: string;
  items: string[];
  value: string;
  onPick: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <span className="w-14 text-xs uppercase tracking-wide text-muted">
        {label}
      </span>
      {items.map((it) => (
        <button
          key={it}
          onClick={() => onPick(it)}
          className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
            value === it
              ? "border-accent bg-accent/10 text-accent-soft"
              : "border-border text-foreground hover:border-accent"
          }`}
        >
          {it}
        </button>
      ))}
    </div>
  );
}
