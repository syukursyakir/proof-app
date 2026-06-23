"use client";

/**
 * VoiceOrb — audio-reactive 3D voice visualizer (R3F + custom GLSL).
 *
 * Usage:
 *   const [state, setState] = useState<VoiceOrbState>("idle");
 *   // drive the level yourself (e.g. from an SDK):
 *   <VoiceOrb state={state} getLevel={() => conversation.getOutputVolume()} size={320} />
 *   // or let the component analyse a source:
 *   <VoiceOrb state="speaking" audioSource={ttsAudioEl} />
 *   <VoiceOrb state="listening" enableMic />
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

export type VoiceOrbState =
  | "idle"
  | "listening"
  | "speaking"
  | "thinking"
  | "error";

export type VoiceOrbShape = "blob" | "ring" | "knot" | "particles" | "wave";

export type VoiceOrbProps = {
  state?: VoiceOrbState;
  shape?: VoiceOrbShape;
  /** rendered size in px (square) */
  size?: number;
  className?: string;
  /** pre-computed audio level 0..1 (highest priority) */
  level?: number;
  /** pull callback returning 0..1 each frame (e.g. SDK getOutputVolume) */
  getLevel?: () => number;
  /** let the component build its own analyser from this source */
  audioSource?: MediaStream | HTMLMediaElement | AudioNode | null;
  /** opt-in: component requests the mic itself (for standalone "listening") */
  enableMic?: boolean;
  ariaLabel?: string;
};

/* ----------------------------- GLSL ----------------------------- */

const SNOISE = /* glsl */ `
vec3 mod289(vec3 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 mod289(vec4 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 permute(vec4 x){ return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}
float fbm(vec3 p){
  float value = 0.0;
  float amp = 0.5;
  float freq = 1.0;
  for (int i = 0; i < 4; i++) {
    value += amp * snoise(p * freq);
    freq *= 2.0;
    amp *= 0.5;
  }
  return value;
}
`;

const VERTEX = /* glsl */ `
uniform float uTime;
uniform float uAmp;
uniform float uFreq;
uniform float uAudio;
uniform float uPointSize;
varying float vDisp;
varying vec3 vNormalW;
varying vec3 vViewDir;
${SNOISE}
void main(){
  vec3 p = position * uFreq + vec3(0.0, 0.0, uTime * 0.6);
  float n = fbm(p + uTime * 0.15);
  float disp = uAmp * n;
  vec3 newPos = position + normal * disp;
  vDisp = n;
  vec4 worldPos = modelMatrix * vec4(newPos, 1.0);
  vNormalW = normalize(mat3(modelMatrix) * normal);
  vViewDir = normalize(cameraPosition - worldPos.xyz);
  vec4 mvPos = viewMatrix * worldPos;
  gl_PointSize = uPointSize * (1.0 / max(0.1, -mvPos.z));
  gl_Position = projectionMatrix * mvPos;
}
`;

const SURFACE_FRAG = /* glsl */ `
precision highp float;
uniform vec3 uColorLow;
uniform vec3 uColorHigh;
uniform vec3 uColorRim;
uniform float uFresnelPower;
uniform float uAudio;
uniform float uOpacity;
varying float vDisp;
varying vec3 vNormalW;
varying vec3 vViewDir;
void main(){
  float d = clamp(vDisp * 0.6 + 0.5, 0.0, 1.0);
  vec3 base = mix(uColorLow, uColorHigh, d);
  float fres = pow(1.0 - clamp(dot(normalize(vNormalW), normalize(vViewDir)), 0.0, 1.0), uFresnelPower);
  vec3 col = base + uColorRim * fres * (0.7 + 0.8 * uAudio);
  gl_FragColor = vec4(col, uOpacity);
}
`;

const POINTS_FRAG = /* glsl */ `
precision highp float;
uniform vec3 uColorLow;
uniform vec3 uColorHigh;
uniform vec3 uColorRim;
uniform float uAudio;
uniform float uOpacity;
varying float vDisp;
void main(){
  vec2 cc = gl_PointCoord - 0.5;
  float r = length(cc);
  if (r > 0.5) discard;
  float d = clamp(vDisp * 0.6 + 0.5, 0.0, 1.0);
  vec3 col = mix(uColorLow, uColorHigh, d) + uColorRim * 0.5 * (0.5 + uAudio);
  float alpha = smoothstep(0.5, 0.0, r) * uOpacity;
  gl_FragColor = vec4(col, alpha);
}
`;

/* --------------------------- helpers --------------------------- */

function makeUniforms(): Record<string, THREE.IUniform> {
  return {
    uTime: { value: 0 },
    uAmp: { value: 0.1 },
    uFreq: { value: 1.1 },
    uAudio: { value: 0 },
    uFresnelPower: { value: 2.6 },
    uOpacity: { value: 1 },
    uPointSize: { value: 18 },
    uColorLow: { value: new THREE.Color("#4f46e5") },
    uColorHigh: { value: new THREE.Color("#6d5ef8") },
    uColorRim: { value: new THREE.Color("#b9aeff") },
  };
}

function makeGeometry(shape: VoiceOrbShape): THREE.BufferGeometry {
  switch (shape) {
    case "ring":
      return new THREE.TorusGeometry(0.95, 0.42, 64, 220);
    case "knot":
      return new THREE.TorusKnotGeometry(0.85, 0.3, 220, 32);
    case "wave":
      return new THREE.PlaneGeometry(2.6, 2.6, 140, 140);
    case "particles":
      return new THREE.IcosahedronGeometry(1.3, 32);
    case "blob":
    default:
      return new THREE.IcosahedronGeometry(1.25, 24);
  }
}

function cssVar(cs: CSSStyleDeclaration, name: string, fallback: string): string {
  const v = cs.getPropertyValue(name).trim();
  return v || fallback;
}

type Palette = {
  amp: number;
  freq: number;
  speed: number;
  fres: number;
  audioGain: number;
  audioWeight: number;
  glow: number;
  low: THREE.Color;
  high: THREE.Color;
  rim: THREE.Color;
};

function buildStates(): Record<VoiceOrbState, Palette> {
  // Read brand tokens live; derive tints. Falls back to known values.
  const cs = getComputedStyle(document.documentElement);
  const accent = new THREE.Color(cssVar(cs, "--accent", "#6d5ef8"));
  const accentSoft = new THREE.Color(cssVar(cs, "--accent-soft", "#4f46e5"));
  const bg = new THREE.Color(cssVar(cs, "--background", "#ffffff"));

  const white = new THREE.Color("#ffffff");
  const black = new THREE.Color("#000000");
  const deep = accentSoft.clone().lerp(black, 0.28);
  const light = accent.clone().lerp(white, 0.5);
  const lightest = accent.clone().lerp(white, 0.78);

  return {
    idle: {
      amp: 0.1, freq: 1.1, speed: 0.25, fres: 2.8, audioGain: 0, audioWeight: 0,
      glow: 0.35, low: deep.clone(), high: accentSoft.clone(), rim: light.clone(),
    },
    listening: {
      amp: 0.16, freq: 1.5, speed: 0.6, fres: 2.2, audioGain: 0.9, audioWeight: 1,
      glow: 0.5, low: accentSoft.clone(), high: accent.clone(), rim: light.clone(),
    },
    speaking: {
      amp: 0.26, freq: 2.0, speed: 1.1, fres: 1.7, audioGain: 1.1, audioWeight: 1,
      glow: 0.6, low: accent.clone(), high: light.clone(), rim: lightest.clone(),
    },
    thinking: {
      amp: 0.18, freq: 1.9, speed: 0.8, fres: 2.4, audioGain: 0, audioWeight: 0,
      glow: 0.45, low: deep.clone(), high: accent.clone(), rim: light.clone(),
    },
    error: {
      amp: 0.12, freq: 1.0, speed: 0.3, fres: 2.0, audioGain: 0, audioWeight: 0,
      glow: 0.4,
      low: new THREE.Color("#5b1a1a"),
      high: new THREE.Color("#ef4444"),
      rim: new THREE.Color("#fca5a5"),
    },
    // store theme hint on idle via closure not needed; bg luminance read below
  } as Record<VoiceOrbState, Palette> & { __bgLum?: number };
}

function luminance(c: THREE.Color): number {
  return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
}

/* ---------------------------- scene ---------------------------- */

function OrbScene({
  state,
  shape,
  level,
  getLevel,
  audioSource,
  enableMic,
}: Required<Pick<VoiceOrbProps, "state" | "shape">> &
  Pick<VoiceOrbProps, "level" | "getLevel" | "audioSource" | "enableMic">) {
  const isLight = useMemo(() => {
    const cs = getComputedStyle(document.documentElement);
    return luminance(new THREE.Color(cssVar(cs, "--background", "#ffffff"))) > 0.5;
  }, []);
  const states = useMemo(() => buildStates(), []);

  const geometry = useMemo(() => makeGeometry(shape), [shape]);

  const coreMat = useMemo(() => {
    const m = new THREE.ShaderMaterial({
      uniforms: makeUniforms(),
      vertexShader: VERTEX,
      fragmentShader: shape === "particles" ? POINTS_FRAG : SURFACE_FRAG,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: shape !== "particles",
      blending:
        shape === "particles" && !isLight
          ? THREE.AdditiveBlending
          : THREE.NormalBlending,
    });
    return m;
  }, [shape, isLight]);

  const glowMat = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: makeUniforms(),
      vertexShader: VERTEX,
      fragmentShader: SURFACE_FRAG,
      transparent: true,
      side: THREE.BackSide,
      depthWrite: false,
      blending: isLight ? THREE.NormalBlending : THREE.AdditiveBlending,
    });
  }, [isLight]);

  // dispose on shape/theme change + unmount
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => coreMat.dispose(), [coreMat]);
  useEffect(() => () => glowMat.dispose(), [glowMat]);

  // optional internal analyser (only when parent doesn't drive the level)
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  useEffect(() => {
    if (typeof getLevel === "function" || typeof level === "number") return;
    if (!audioSource && !enableMic) return;
    let ctx: AudioContext | null = null;
    let stream: MediaStream | null = null;
    let cancelled = false;

    (async () => {
      try {
        ctx = new AudioContext();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        if (audioSource instanceof MediaStream) {
          ctx.createMediaStreamSource(audioSource).connect(analyser);
        } else if (audioSource instanceof HTMLMediaElement) {
          const src = ctx.createMediaElementSource(audioSource);
          src.connect(analyser);
          analyser.connect(ctx.destination);
        } else if (audioSource) {
          (audioSource as AudioNode).connect(analyser);
        } else if (enableMic) {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          if (cancelled) return;
          ctx.createMediaStreamSource(stream).connect(analyser);
        }
        analyserRef.current = analyser;
        dataRef.current = new Uint8Array(analyser.frequencyBinCount);
      } catch {
        /* no audio — orb still animates from state targets */
      }
    })();

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
      ctx?.close().catch(() => {});
      analyserRef.current = null;
      dataRef.current = null;
    };
  }, [audioSource, enableMic, getLevel, level]);

  // smoothed, per-frame state. Never feed raw values to the shader.
  const cur = useRef<Palette>({ ...states.idle, low: states.idle.low.clone(), high: states.idle.high.clone(), rim: states.idle.rim.clone() });
  const audioCur = useRef(0);
  const timeRef = useRef(0);
  const groupRef = useRef<THREE.Group>(null);

  function readLevel(): number {
    if (typeof getLevel === "function") {
      try {
        return getLevel() || 0;
      } catch {
        return 0;
      }
    }
    if (typeof level === "number") return level;
    const a = analyserRef.current;
    const d = dataRef.current;
    if (a && d) {
      a.getByteFrequencyData(d);
      let s = 0;
      for (let i = 0; i < d.length; i++) s += d[i];
      return s / d.length / 255;
    }
    return 0;
  }

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = states[state];
    const c = cur.current;
    const k = 1 - Math.exp(-6 * dt); // param smoothing
    c.amp += (t.amp - c.amp) * k;
    c.freq += (t.freq - c.freq) * k;
    c.speed += (t.speed - c.speed) * k;
    c.fres += (t.fres - c.fres) * k;
    c.audioGain += (t.audioGain - c.audioGain) * k;
    c.audioWeight += (t.audioWeight - c.audioWeight) * k;
    c.glow += (t.glow - c.glow) * k;
    c.low.lerp(t.low, k);
    c.high.lerp(t.high, k);
    c.rim.lerp(t.rim, k);

    const raw = Math.max(0, Math.min(1, readLevel()));
    const targetAudio = raw * c.audioWeight;
    audioCur.current += (targetAudio - audioCur.current) * (1 - Math.exp(-10 * dt));

    timeRef.current += dt * c.speed;
    const amp = c.amp + audioCur.current * c.audioGain;

    const set = (u: Record<string, THREE.IUniform>, opacity: number) => {
      u.uTime.value = timeRef.current;
      u.uAmp.value = amp;
      u.uFreq.value = c.freq;
      u.uFresnelPower.value = c.fres;
      u.uAudio.value = audioCur.current;
      u.uOpacity.value = opacity;
      u.uColorLow.value = c.low;
      u.uColorHigh.value = c.high;
      u.uColorRim.value = c.rim;
    };
    set(coreMat.uniforms, 1);
    set(glowMat.uniforms, c.glow);

    if (groupRef.current) {
      groupRef.current.rotation.y += dt * 0.15;
      groupRef.current.rotation.x = shape === "wave" ? -0.7 : groupRef.current.rotation.x + dt * 0.02;
    }
  });

  return (
    <group ref={groupRef}>
      {shape === "particles" ? (
        <points geometry={geometry} material={coreMat} />
      ) : (
        <>
          <mesh geometry={geometry} material={coreMat} />
          <mesh geometry={geometry} material={glowMat} scale={1.18} />
        </>
      )}
    </group>
  );
}

/* --------------------------- wrapper --------------------------- */

export default function VoiceOrb({
  state = "idle",
  shape = "blob",
  size = 320,
  className,
  level,
  getLevel,
  audioSource = null,
  enableMic = false,
  ariaLabel,
}: VoiceOrbProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => setVisible(e.isIntersecting),
      { threshold: 0.01 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const label = ariaLabel ?? `Voice visualizer, ${state}`;

  if (reduced) {
    // Gentle static glow, no continuous animation.
    return (
      <div
        ref={wrapRef}
        className={className}
        role="img"
        aria-label={label}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 50% 45%, var(--accent, #6d5ef8) 0%, color-mix(in srgb, var(--accent, #6d5ef8) 40%, transparent) 45%, transparent 70%)",
        }}
      />
    );
  }

  return (
    <div
      ref={wrapRef}
      className={className}
      role="img"
      aria-label={label}
      style={{ width: size, height: size }}
    >
      <Canvas
        frameloop={visible ? "always" : "never"}
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        camera={{ position: [0, 0, 4.2], fov: 45 }}
        style={{ width: "100%", height: "100%" }}
      >
        <OrbScene
          state={state}
          shape={shape}
          level={level}
          getLevel={getLevel}
          audioSource={audioSource}
          enableMic={enableMic}
        />
      </Canvas>
    </div>
  );
}
