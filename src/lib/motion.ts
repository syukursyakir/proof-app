import type { Variants, Transition } from "framer-motion";

// Motion system — define tokens once, use everywhere (Stripe/Linear practice).
export const ease = {
  out: [0.16, 1, 0.3, 1] as [number, number, number, number], // easeOutExpo — premium hero curve
  inOut: [0.65, 0, 0.35, 1] as [number, number, number, number],
  ui: [0.23, 1, 0.32, 1] as [number, number, number, number],
};

export const duration = {
  micro: 0.16,
  ui: 0.3,
  entrance: 0.6,
};

export const spring: Record<"snappy" | "smooth" | "bouncy", Transition> = {
  snappy: { type: "spring", stiffness: 400, damping: 30, mass: 1 },
  smooth: { type: "spring", stiffness: 120, damping: 20, mass: 1 },
  bouncy: { type: "spring", stiffness: 300, damping: 12, mass: 1 },
};

// Stagger container + item for entrances and card grids.
export const containerV: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { delayChildren: 0.15, staggerChildren: 0.1 },
  },
};

export const itemV: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.entrance, ease: ease.out },
  },
};
