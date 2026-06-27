"use client";

import Link from "next/link";
import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import SiteNav from "@/components/SiteNav";
import HeroBackground from "@/components/HeroBackground";
import HeroOrb from "@/components/HeroOrb";
import ClarionFeatures from "@/components/ClarionFeatures";
import {
  CountUp,
  Item,
  MagneticButton,
  Reveal,
  ScrollProgress,
  SecondaryButton,
  Stagger,
} from "@/components/motion";
import { containerV, itemV } from "@/lib/motion";
import { useSiteLocale } from "@/components/SiteLocaleProvider";

export default function Home() {
  const { dict } = useSiteLocale();
  const l = dict.employer.landing;

  const pillars = [
    { title: l.pillar1Title, body: l.pillar1Body },
    { title: l.pillar2Title, body: l.pillar2Body },
    { title: l.pillar3Title, body: l.pillar3Body },
    { title: l.pillar4Title, body: l.pillar4Body },
  ];

  const stats = [
    { value: 14900, prefix: "$", suffix: "", decimals: 0, label: l.statCost },
    { value: 74, prefix: "", suffix: "%", decimals: 0, label: l.statBadHire },
    { value: 1.58, prefix: "", suffix: "", decimals: 2, label: l.statJobOpenings },
  ];

  const heroRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const orbY = useSpring(useTransform(scrollYProgress, [0, 1], [0, -70]), {
    stiffness: 400,
    damping: 90,
  });

  return (
    <div className="flex flex-col flex-1">
      <ScrollProgress />
      <SiteNav />

      {/* Hero */}
      <section ref={heroRef} className="relative overflow-hidden">
        <HeroBackground />
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 pb-20 pt-32 lg:grid-cols-2 lg:pb-28 lg:pt-44">
          <motion.div variants={containerV} initial="hidden" animate="visible">
            <motion.p
              variants={itemV}
              className="mb-5 inline-flex items-center rounded-full border border-border bg-white/60 px-3 py-1 text-xs font-medium text-muted backdrop-blur"
            >
              {l.heroTag}
            </motion.p>
            <motion.h1
              variants={itemV}
              className="text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl"
            >
              {l.heroTitleLine1}
              <br />
              {l.heroTitleLine2}
            </motion.h1>
            <motion.p
              variants={itemV}
              className="mt-6 max-w-xl text-lg leading-8 text-muted"
            >
              {l.heroBody.split(l.heroBodyEvidence)[0]}
              <span className="text-foreground">{l.heroBodyEvidence}</span>
              {l.heroBody.split(l.heroBodyEvidence)[1]}
            </motion.p>
            <motion.div variants={itemV} className="mt-9 flex flex-col gap-3 sm:flex-row">
              <MagneticButton href="/roles/new">
                {l.buildAssessment}
              </MagneticButton>
              <SecondaryButton href="/sample">
                {l.seeSample}{" "}
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </SecondaryButton>
            </motion.div>
            <motion.p variants={itemV} className="mt-5 text-sm text-muted">
              {l.heroFootnote}
            </motion.p>
          </motion.div>

          {/* money shot: orb + verdict card, gentle parallax */}
          <motion.div
            style={{ y: reduce ? 0 : orbY }}
            className="relative flex items-center justify-center"
          >
            <div className="relative flex h-[340px] w-full items-center justify-center">
              <div className="-translate-y-10">
                <HeroOrb size={300} />
              </div>
              <p className="absolute bottom-2 left-1/2 w-64 -translate-x-1/2 text-center text-xs text-muted">
                {l.heroCaption}
              </p>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="absolute -bottom-6 -right-2 w-64 rounded-xl border border-border bg-card/90 p-4 shadow-2xl backdrop-blur"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{l.heroCardCriterion}</span>
                  <span className="text-sm font-semibold text-accent-soft">{l.heroCardScore}</span>
                </div>
                <p className="mt-2 text-xs leading-5 text-muted">
                  {l.heroCardJustification}
                </p>
                <p className="mt-2 rounded-md bg-accent/15 px-2 py-1 text-xs leading-5 text-foreground">
                  {l.heroCardQuote}
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Candidate join band — Kahoot-style */}
      <section className="border-t border-border/60 bg-card/40">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-6 sm:flex-row">
          <div className="text-center sm:text-left">
            <p className="font-medium">{l.invitedTitle}</p>
            <p className="text-sm text-muted">{l.invitedBody}</p>
          </div>
          <Link
            href="/join"
            className="rounded-full border border-accent/40 bg-white px-6 py-2.5 text-sm font-medium text-accent-soft transition-colors hover:bg-accent hover:text-white"
          >
            Enter your code →
          </Link>
        </div>
      </section>

      {/* Problem */}
      <section className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center">
          <Reveal>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {l.problemTitle}
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted">
              {l.problemBody.split(l.problemBodySocialCapital)[0]}
              <span className="text-foreground">{l.problemBodySocialCapital}</span>
              {l.problemBody.split(l.problemBodySocialCapital)[1]}
            </p>
          </Reveal>
          <Stagger className="mt-12 grid gap-6 sm:grid-cols-3">
            {stats.map((s) => (
              <Item
                key={s.label}
                className="lift rounded-xl border border-border bg-card/50 p-6"
              >
                <div className="text-3xl font-semibold text-accent-soft">
                  <CountUp
                    value={s.value}
                    prefix={s.prefix}
                    suffix={s.suffix}
                    decimals={s.decimals}
                  />
                </div>
                <div className="mt-2 text-sm text-muted">{s.label}</div>
              </Item>
            ))}
          </Stagger>
        </div>
      </section>

      {/* How it works */}
      <Reveal>
        <ClarionFeatures />
      </Reveal>

      {/* Why Clarion */}
      <section className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <Reveal>
            <h2 className="text-center text-3xl font-semibold tracking-tight sm:text-4xl">
              {l.whyTitle}
            </h2>
          </Reveal>
          <Stagger className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {pillars.map((p) => (
              <Item
                key={p.title}
                className="lift rounded-2xl border border-border bg-card/50 p-6"
              >
                <h3 className="text-lg font-semibold">{p.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted">{p.body}</p>
              </Item>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Glass box */}
      <section className="border-t border-border/60">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-2">
          <Reveal>
            <p className="mb-4 inline-flex rounded-full border border-border px-3 py-1 text-xs font-medium text-accent-soft">
              {l.glassBoxTag}
            </p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {l.glassBoxTitle}
            </h2>
            <p className="mt-5 text-lg leading-8 text-muted">
              {l.glassBoxBody.split(l.glassBoxBodyAnd)[0]}
              <span className="text-foreground"> {l.glassBoxBodyAnd}</span>
              {l.glassBoxBody.split(l.glassBoxBodyAnd)[1]}
            </p>
          </Reveal>
          <Reveal delay={0.1} className="lift rounded-2xl border border-border bg-card/70 p-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <span className="font-medium">{l.glassBoxCardTitle}</span>
              <span className="rounded-full bg-accent/15 px-3 py-1 text-sm text-accent-soft">
                {l.glassBoxRecommend}
              </span>
            </div>
            {[
              [l.glassCrit1, l.glassScore1, l.glassQuote1],
              [l.glassCrit2, l.glassScore2, l.glassQuote2],
              [l.glassCrit3, l.glassScore3, l.glassQuote3],
            ].map(([crit, score, quote]) => (
              <div key={crit} className="border-b border-border/60 py-4 last:border-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{crit}</span>
                  <span className="text-sm font-semibold text-accent-soft">{score}</span>
                </div>
                <p className="mt-2 rounded-md bg-accent/10 px-3 py-2 text-xs leading-5 text-foreground/90">
                  {quote}
                </p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* Final CTA — the one dark, premium moment on the cream page */}
      <section className="px-4 py-16 sm:px-6 sm:py-24">
        <Reveal>
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-[#15233f] px-6 py-20 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_40px_80px_-32px_rgba(21,35,63,0.6)] sm:px-12">
            {/* warm + cool glows */}
            <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#e0922f]/20 blur-[90px]" />
            <div className="pointer-events-none absolute -bottom-28 -right-16 h-80 w-80 rounded-full bg-[#3a4f7a]/40 blur-[100px]" />
            <div className="grain absolute inset-0 opacity-[0.04]" />

            <div className="relative">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#e0922f]">
                {l.ctaTag}
              </p>
              <h2 className="mx-auto mt-5 max-w-2xl text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-6xl">
                {l.ctaTitleLine1}
                <br />
                {l.ctaTitleLine2}
              </h2>
              <p className="mx-auto mt-5 max-w-lg text-base leading-7 text-white/65">
                {l.ctaBody}
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/roles/new"
                  className="rounded-full bg-[#e0922f] px-7 py-3 font-medium text-[#15233f] shadow-lg transition-transform hover:scale-[1.03]"
                >
                  {l.buildAssessment}
                </Link>
                <Link
                  href="/sample"
                  className="rounded-full border border-white/20 px-7 py-3 font-medium text-white/90 transition-colors hover:bg-white/5"
                >
                  {l.seeSample} →
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8 text-sm text-muted">
          <span>Clarion</span>
          <span>{l.footerTagline}</span>
        </div>
      </footer>
    </div>
  );
}
