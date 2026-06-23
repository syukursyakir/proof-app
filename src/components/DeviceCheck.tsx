"use client";

import { useEffect, useRef, useState } from "react";

// Pre-flight: let the candidate confirm camera + mic work before the interview.
export default function DeviceCheck() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const [status, setStatus] = useState<"idle" | "ok" | "denied">("idle");
  const [level, setLevel] = useState(0);

  useEffect(() => () => cleanupRef.current?.(), []);

  async function run() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      const ctx = new AudioContext();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      src.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>;
      let raf = 0;
      const tick = () => {
        analyser.getByteFrequencyData(data);
        let s = 0;
        for (let i = 0; i < data.length; i++) s += data[i];
        setLevel(Math.min(1, s / data.length / 90));
        raf = requestAnimationFrame(tick);
      };
      tick();
      cleanupRef.current = () => {
        cancelAnimationFrame(raf);
        ctx.close().catch(() => {});
        stream.getTracks().forEach((t) => t.stop());
      };
      setStatus("ok");
    } catch {
      setStatus("denied");
    }
  }

  return (
    <div className="mt-4">
      {status !== "ok" && (
        <button
          onClick={run}
          className="text-sm text-muted underline hover:text-foreground"
        >
          Test your camera &amp; mic first
        </button>
      )}
      <div className={status === "ok" ? "mx-auto mt-2 w-56" : "hidden"}>
        <video
          ref={videoRef}
          muted
          playsInline
          className="h-32 w-full rounded-lg border border-border bg-black/60 object-cover"
        />
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs text-muted">Mic</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-border">
            <div
              className="h-full bg-accent"
              style={{ width: `${Math.round(level * 100)}%` }}
            />
          </div>
        </div>
        <p className="mt-2 text-xs text-green-600">
          Camera on — speak and the bar should move.
        </p>
      </div>
      {status === "denied" && (
        <p className="mt-2 text-sm text-red-600">
          Couldn&apos;t access your camera/mic. Check browser permissions, or take the
          written interview below.
        </p>
      )}
    </div>
  );
}
