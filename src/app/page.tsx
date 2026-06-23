"use client";

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

const pillars = [
  {
    title: "Consistent, not moody",
    body: "Same questions, same scoring, every candidate — not how the interviewer felt that day.",
  },
  {
    title: "Skill over social capital",
    body: "Judged on what they demonstrate, not who they know or where they studied.",
  },
  {
    title: "Transparent to both sides",
    body: "The employer sees the evidence; the candidate knows exactly what they’re assessed on.",
  },
  {
    title: "Built for small teams",
    body: "No enterprise contract, no recruiter required. Set up a role and start by Friday.",
  },
];

const stats = [
  {
    value: 14900,
    prefix: "$",
    suffix: "",
    decimals: 0,
    label: "average cost of one bad hire (CareerBuilder)",
  },
  {
    value: 74,
    prefix: "",
    suffix: "%",
    decimals: 0,
    label: "of small businesses have made a bad hire",
  },
  {
    value: 1.58,
    prefix: "",
    suffix: "",
    decimals: 2,
    label: "job openings per jobseeker in Singapore (MOM, 2025)",
  },
];

export default function Home() {
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
              For small teams who can&apos;t afford to hire wrong
            </motion.p>
            <motion.h1
              variants={itemV}
              className="text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl"
            >
              Hear the proof,
              <br />
              not the pedigree.
            </motion.h1>
            <motion.p
              variants={itemV}
              className="mt-6 max-w-xl text-lg leading-8 text-muted"
            >
              Clarion gives every candidate the same AI-run voice interview, scores them
              consistently against <span className="text-foreground">your</span> rubric, and
              shows you the exact words behind every judgment. You make the final call.
            </motion.p>
            <motion.div variants={itemV} className="mt-9 flex flex-col gap-3 sm:flex-row">
              <MagneticButton href="/roles/new">
                <span aria-hidden>🎙️</span> Describe your ideal hire
              </MagneticButton>
              <SecondaryButton href="/sample">
                See a sample verdict{" "}
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </SecondaryButton>
            </motion.div>
            <motion.p variants={itemV} className="mt-5 text-sm text-muted">
              No resume screening. No gut calls. The same fair interview for everyone.
            </motion.p>
          </motion.div>

          {/* money shot: orb + verdict card, gentle parallax */}
          <motion.div
            style={{ y: reduce ? 0 : orbY }}
            className="relative flex items-center justify-center"
          >
            <div className="relative flex h-[340px] w-full items-center justify-center">
              <div className="orb-glow orb-pulse h-44 w-44 rounded-full bg-[radial-gradient(circle_at_35%_30%,#b9aefff2,#6d5ef8_45%,#3b2fb0_100%)]" />
              <p className="absolute bottom-2 left-1/2 w-64 -translate-x-1/2 text-center text-xs text-muted">
                Interviewing&hellip; &ldquo;Tell me about a time you calmed an angry customer.&rdquo;
              </p>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="absolute -bottom-6 -right-2 w-64 rounded-xl border border-border bg-card/90 p-4 shadow-2xl backdrop-blur"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Customer empathy</span>
                  <span className="text-sm font-semibold text-accent-soft">4 / 5</span>
                </div>
                <p className="mt-2 text-xs leading-5 text-muted">
                  Acknowledged the customer&apos;s frustration before problem-solving.
                </p>
                <p className="mt-2 rounded-md bg-accent/15 px-2 py-1 text-xs leading-5 text-foreground">
                  &ldquo;I told her I completely understood why she was upset, and that I&apos;d
                  stay on until it was fixed.&rdquo;
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Problem */}
      <section className="border-t border-border/60">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <Reveal>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Small employers hire on the wrong signals.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted">
              No recruiting team, no time. So screening comes down to resumes, referrals, and
              gut feel — hiring on <span className="text-foreground">social capital, not
              skill</span>. Good candidates with the wrong network get filtered out, and
              everyone gets a different interview on a different day from someone in a
              different mood.
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
              Why Clarion
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
              The glass box
            </p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Most AI hiring tools score you in a black box. Clarion shows its work.
            </h2>
            <p className="mt-5 text-lg leading-8 text-muted">
              Every score expands to the transcript quote behind it. The AI assesses; the
              human decides. No mystery verdicts, no unaccountable rejections — for the
              employer<span className="text-foreground"> and</span> the candidate.
            </p>
          </Reveal>
          <Reveal delay={0.1} className="lift rounded-2xl border border-border bg-card/70 p-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <span className="font-medium">Verdict — Customer Support</span>
              <span className="rounded-full bg-accent/15 px-3 py-1 text-sm text-accent-soft">
                Recommend: advance
              </span>
            </div>
            {[
              ["Customer empathy", "4 / 5", "“I told her I completely understood why she was upset.”"],
              ["Problem ownership", "5 / 5", "“I stayed on the line until the refund actually cleared.”"],
              ["Composure under pressure", "3 / 5", "“I got a bit flustered but I asked a colleague for help.”"],
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

      {/* Final CTA */}
      <section className="border-t border-border/60">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <Reveal>
            <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Stop guessing who can do the job.
              <br />
              Start with proof.
            </h2>
            <div className="mt-10 flex justify-center">
              <MagneticButton href="/roles/new">
                <span aria-hidden>🎙️</span> Describe your ideal hire
              </MagneticButton>
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8 text-sm text-muted">
          <span>Clarion</span>
          <span>The AI assesses. You decide.</span>
        </div>
      </footer>
    </div>
  );
}
