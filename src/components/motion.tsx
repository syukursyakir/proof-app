"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import type { ReactNode } from "react";
import { containerV, ease, itemV, spring } from "@/lib/motion";

export const MotionLink = motion.create(Link);

// Scroll-reveal wrapper (subtler + shorter than the hero, per the spec).
export function Reveal({
  children,
  className,
  delay = 0,
  y = 24,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3, margin: "0px 0px -100px 0px" }}
      transition={{ duration: 0.5, ease: ease.out, delay }}
    >
      {children}
    </motion.div>
  );
}

// Stagger group for card grids — children use <Item />.
export function Stagger({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={containerV}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

export function Item({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={className} variants={itemV}>
      {children}
    </motion.div>
  );
}

export function PrimaryButton({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <MotionLink
      href={href}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={spring.snappy}
      className={`group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-accent px-7 font-medium text-white shadow-[0_8px_30px_-12px_rgba(109,94,248,0.7)] ${className}`}
    >
      {children}
    </MotionLink>
  );
}

export function SecondaryButton({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <MotionLink
      href={href}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={spring.snappy}
      className={`group inline-flex h-12 items-center justify-center gap-2 rounded-full border border-border px-7 font-medium text-foreground hover:border-accent ${className}`}
    >
      {children}
    </MotionLink>
  );
}
