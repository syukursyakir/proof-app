"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import SiteNav from "@/components/SiteNav";
import HeroBackground from "@/components/HeroBackground";
import DashboardPreview from "@/components/DashboardPreview";
import { PlayIcon } from "@/components/icons";
import ClarionFeatures from "@/components/ClarionFeatures";
import {
  CountUp,
  Item,
  MagneticButton,
  Reveal,
  ScrollProgress,
  Stagger,
} from "@/components/motion";
import { useSiteLocale } from "@/components/SiteLocaleProvider";

// Real demo video from the hackathon submission — not a placeholder.
const DEMO_VIDEO_URL = "https://youtu.be/0ZefiPXbo7Y";

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

  return (
    <div className="flex flex-col flex-1">
      <ScrollProgress />

      {/* Hero — fills exactly 100vh, no scroll inside it */}
      <div className="relative flex h-screen flex-col overflow-hidden bg-background">
        <HeroBackground />
        <SiteNav />

        <div className="relative z-10 flex flex-1 flex-col items-center px-6 pt-2 text-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-1.5 text-sm text-muted"
          >
            {l.heroBadge}
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="max-w-xl font-display text-5xl leading-[0.95] tracking-tight text-foreground md:text-6xl lg:text-[5rem]"
          >
            {l.heroTitleLine1}
            <br />
            <span className="italic">{l.heroTitleLine2}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-4 max-w-[650px] text-center text-base leading-relaxed text-muted md:text-lg"
          >
            {l.heroBody.split(l.heroBodyEvidence)[0]}
            <span className="text-foreground">{l.heroBodyEvidence}</span>
            {l.heroBody.split(l.heroBodyEvidence)[1]}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-5 flex items-center gap-3"
          >
            <MagneticButton href="/roles/new">{l.buildAssessment}</MagneticButton>
            <a
              href={DEMO_VIDEO_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={l.watchDemo}
              title={l.watchDemo}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-background shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition-colors hover:bg-card/60"
            >
              <PlayIcon className="h-4 w-4 fill-foreground" />
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-8 w-full max-w-5xl"
          >
            <DashboardPreview dict={dict} />
          </motion.div>
        </div>
      </div>

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
            <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-accent-warm/20 blur-[90px]" />
            <div className="pointer-events-none absolute -bottom-28 -right-16 h-80 w-80 rounded-full bg-accent/40 blur-[100px]" />
            <div className="grain absolute inset-0 opacity-[0.04]" />

            <div className="relative">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent-warm">
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
                  className="rounded-full bg-accent-warm px-7 py-3 font-medium text-accent shadow-lg transition-transform hover:scale-[1.03]"
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

      {/* Candidate entry point */}
      <section className="border-t border-border/60 bg-card/40">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 py-10 sm:flex-row">
          <div>
            <p className="font-semibold">{l.invitedTitle}</p>
            <p className="mt-1 text-sm text-muted">{l.invitedBody}</p>
          </div>
          <Link
            href="/join"
            className="shrink-0 rounded-full border border-accent/40 bg-white px-6 py-2.5 text-sm font-medium text-accent-soft transition-colors hover:bg-accent hover:text-white"
          >
            Enter your interview code →
          </Link>
        </div>
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
