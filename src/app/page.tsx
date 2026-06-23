import Link from "next/link";
import ProofFeatures from "@/components/ProofFeatures";

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

export default function Home() {
  return (
    <div className="flex flex-col flex-1">
      {/* Nav */}
      <header className="w-full border-b border-border/60">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="inline-block h-5 w-5 rounded-full bg-accent shadow-[0_0_18px_4px_rgba(109,94,248,0.6)]" />
            Proof
          </Link>
          <Link
            href="/roles"
            className="rounded-full border border-border px-4 py-2 text-sm text-foreground/90 transition-colors hover:border-accent hover:text-foreground"
          >
            For employers
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute left-1/2 top-[-10%] h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-accent/10 blur-[120px]" />
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 py-20 lg:grid-cols-2 lg:py-28">
          <div>
            <p className="mb-5 inline-flex items-center rounded-full border border-border px-3 py-1 text-xs font-medium text-muted">
              For small teams who can&apos;t afford to hire wrong
            </p>
            <h1 className="text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
              Hire on proof,
              <br />
              not pedigree.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-muted">
              Proof gives every candidate the same AI-run voice interview, scores them
              consistently against <span className="text-foreground">your</span> rubric, and
              shows you the exact words behind every judgment. You make the final call.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/roles/new"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-accent px-7 font-medium text-white transition-colors hover:bg-accent-soft"
              >
                <span aria-hidden>🎙️</span> Describe your ideal hire
              </Link>
              <Link
                href="/sample"
                className="inline-flex h-12 items-center justify-center rounded-full border border-border px-7 font-medium text-foreground transition-colors hover:border-accent"
              >
                See a sample verdict →
              </Link>
            </div>
            <p className="mt-5 text-sm text-muted">
              No resume screening. No gut calls. The same fair interview for everyone.
            </p>
          </div>

          {/* The money shot: orb + verdict card */}
          <div className="relative flex items-center justify-center">
            <div className="relative flex h-[340px] w-full items-center justify-center">
              <div className="orb-glow orb-pulse h-44 w-44 rounded-full bg-[radial-gradient(circle_at_35%_30%,#b9aefff2,#6d5ef8_45%,#3b2fb0_100%)]" />
              <p className="absolute bottom-2 left-1/2 w-64 -translate-x-1/2 text-center text-xs text-muted">
                Interviewing&hellip; &ldquo;Tell me about a time you calmed an angry customer.&rdquo;
              </p>
              {/* floating verdict card */}
              <div className="absolute -bottom-6 -right-2 w-64 rounded-xl border border-border bg-card/90 p-4 shadow-2xl backdrop-blur">
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
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="border-t border-border/60">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Small employers hire on the wrong signals.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted">
            No recruiting team, no time. So screening comes down to resumes, referrals, and gut
            feel — hiring on <span className="text-foreground">social capital, not skill</span>.
            Good candidates with the wrong network get filtered out, and everyone gets a different
            interview on a different day from someone in a different mood.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              ["$14,900", "average cost of one bad hire (CareerBuilder)"],
              ["74%", "of small businesses have made a bad hire"],
              ["1.58", "job openings per jobseeker in Singapore (MOM, 2025)"],
            ].map(([stat, label]) => (
              <div key={stat} className="rounded-xl border border-border bg-card/50 p-6">
                <div className="text-3xl font-semibold text-accent-soft">{stat}</div>
                <div className="mt-2 text-sm text-muted">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <ProofFeatures />

      {/* Why Proof */}
      <section className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-center text-3xl font-semibold tracking-tight sm:text-4xl">
            Why Proof
          </h2>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {pillars.map((p) => (
              <div key={p.title} className="rounded-2xl border border-border bg-card/50 p-6">
                <h3 className="text-lg font-semibold">{p.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Glass box */}
      <section className="border-t border-border/60">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-2">
          <div>
            <p className="mb-4 inline-flex rounded-full border border-border px-3 py-1 text-xs font-medium text-accent-soft">
              The glass box
            </p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Most AI hiring tools score you in a black box. Proof shows its work.
            </h2>
            <p className="mt-5 text-lg leading-8 text-muted">
              Every score expands to the transcript quote behind it. The AI assesses; the human
              decides. No mystery verdicts, no unaccountable rejections — for the employer
              <span className="text-foreground"> and</span> the candidate.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card/70 p-6">
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
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-border/60">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Stop guessing who can do the job.
            <br />
            Start with proof.
          </h2>
          <div className="mt-10">
            <Link
              href="/roles/new"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-accent px-8 font-medium text-white transition-colors hover:bg-accent-soft"
            >
              <span aria-hidden>🎙️</span> Describe your ideal hire
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8 text-sm text-muted">
          <span>Proof</span>
          <span>The AI assesses. You decide.</span>
        </div>
      </footer>
    </div>
  );
}
