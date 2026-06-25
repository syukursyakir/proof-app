import type { Dict } from "@/components/LocaleProvider";
import Logo from "@/components/Logo";
import {
  BellIcon,
  ChevronDownIcon,
  DotsIcon,
  PlusIcon,
  SearchIcon,
} from "@/components/icons";
import {
  DashboardIcon,
  RolesIcon,
  CandidatesIcon,
  SettingsIcon,
} from "@/components/icons";

// Hand-coded mockup of the real Clarion dashboard (not a screenshot) — same
// nav labels as the real app sidebar, illustrative demo data otherwise.
export default function DashboardPreview({ dict }: { dict: Dict }) {
  const nav = dict.employer.nav;
  const sidebarItems = [
    { label: nav.dashboard, icon: DashboardIcon, active: true },
    { label: nav.roles, icon: RolesIcon, badge: "3" },
    { label: nav.candidates, icon: CandidatesIcon },
    { label: nav.settings, icon: SettingsIcon },
  ];

  const verdicts = [
    { name: "Mei Lin", role: "Customer Support", score: "4.2 / 5", status: "Advance", tone: "sage" },
    { name: "Arjun K.", role: "Software Engineer", score: "3.1 / 5", status: "Review", tone: "warm" },
    { name: "Siti R.", role: "Sales Associate", score: "4.8 / 5", status: "Advance", tone: "sage" },
    { name: "Daniel T.", role: "Software Engineer", score: "2.4 / 5", status: "Rejected", tone: "clay" },
  ];

  const toneClass: Record<string, string> = {
    sage: "bg-accent-sage/15 text-accent-sage",
    warm: "bg-accent-warm/15 text-accent-warm-soft",
    clay: "bg-accent-clay/15 text-accent-clay",
  };

  return (
    <div
      className="select-none rounded-2xl p-3 text-[11px] md:p-4"
      style={{
        background: "rgba(255, 253, 248, 0.55)",
        border: "1px solid rgba(255, 255, 255, 0.6)",
        boxShadow: "var(--shadow-dashboard)",
      }}
    >
      <div className="overflow-hidden rounded-xl border border-border/60 bg-background/80 pointer-events-none">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <Logo withText={false} size={16} />
            <span className="font-semibold">Clarion</span>
            <ChevronDownIcon className="h-3.5 w-3.5 text-muted" />
          </div>
          <div className="hidden flex-1 items-center justify-center sm:flex">
            <div className="flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3 py-1 text-muted">
              <SearchIcon className="h-3 w-3" />
              <span>Search</span>
              <span className="ml-2 rounded border border-border/70 px-1 text-[9px]">⌘K</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full bg-accent px-3 py-1 font-medium text-white sm:inline">
              + {nav.newRole}
            </span>
            <BellIcon className="h-3.5 w-3.5 text-muted" />
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-soft text-[9px] font-semibold text-white">
              JB
            </span>
          </div>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <div className="hidden w-32 shrink-0 border-r border-border/60 p-2.5 sm:block md:w-40">
            {sidebarItems.map((item) => (
              <div
                key={item.label}
                className={`mb-1 flex items-center justify-between rounded-md px-2 py-1.5 ${
                  item.active ? "bg-accent/10 text-accent" : "text-muted"
                }`}
              >
                <span className="flex items-center gap-2">
                  <item.icon className="h-3 w-3" />
                  {item.label}
                </span>
                {item.badge && (
                  <span className="rounded-full bg-accent-warm/20 px-1.5 text-[9px] text-accent-warm-soft">
                    {item.badge}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Main content */}
          <div className="flex-1 bg-card/20 p-3 md:p-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Welcome, Jamie</span>
              <span className="text-muted">Customize</span>
            </div>

            {/* Action row */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {["Send", "Request", "Transfer", "Deposit", "Pay Bill"].map((a, i) => (
                <span
                  key={a}
                  className={`rounded-full px-2.5 py-1 text-[10px] ${
                    i === 0 ? "bg-accent text-white" : "border border-border/70 text-muted"
                  }`}
                >
                  {a}
                </span>
              ))}
            </div>

            {/* Two cards */}
            <div className="mt-3 flex flex-col gap-3 md:flex-row">
              <div className="flex-1 basis-0 rounded-lg border border-border/60 bg-background/70 p-3">
                <div className="flex items-center gap-1 text-muted">
                  <span>Candidates Assessed</span>
                  <span className="text-accent-sage">✓</span>
                </div>
                <div className="mt-1 text-base font-semibold">
                  128 <span className="text-[10px] font-normal text-muted">this month</span>
                </div>
                <div className="mt-1 flex items-center gap-3 text-[10px]">
                  <span className="text-muted">Last 30 Days</span>
                  <span className="text-accent-sage">+42 advanced</span>
                  <span className="text-accent-clay">-18 rejected</span>
                </div>
                <svg viewBox="0 0 200 60" className="mt-2 h-20 w-full" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="dashChartFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0,45 C20,40 30,20 50,25 C70,30 80,10 100,15 C120,20 130,35 150,28 C170,22 180,8 200,12 L200,60 L0,60 Z"
                    fill="url(#dashChartFill)"
                  />
                  <path
                    d="M0,45 C20,40 30,20 50,25 C70,30 80,10 100,15 C120,20 130,35 150,28 C170,22 180,8 200,12"
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>

              <div className="flex-1 basis-0 rounded-lg border border-border/60 bg-background/70 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{nav.roles}</span>
                  <span className="flex items-center gap-1.5 text-muted">
                    <PlusIcon className="h-3 w-3" />
                    <DotsIcon className="h-3 w-3" />
                  </span>
                </div>
                {[
                  ["Customer Support", "12 candidates"],
                  ["Software Engineer", "8 candidates"],
                  ["Sales Associate", "5 candidates"],
                ].map(([role, count]) => (
                  <div key={role} className="flex items-center justify-between py-1.5">
                    <span>{role}</span>
                    <span className="text-muted">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="mt-3 rounded-lg border border-border/60 bg-background/70 p-3">
              <div className="mb-2 font-medium">Recent verdicts</div>
              <div className="grid grid-cols-4 gap-2 border-b border-border/60 pb-1.5 text-muted">
                <span>Candidate</span>
                <span>Role</span>
                <span>Score</span>
                <span>Status</span>
              </div>
              {verdicts.map((v) => (
                <div key={v.name} className="grid grid-cols-4 gap-2 py-1.5">
                  <span>{v.name}</span>
                  <span className="text-muted">{v.role}</span>
                  <span>{v.score}</span>
                  <span>
                    <span className={`rounded-full px-1.5 py-0.5 text-[9px] ${toneClass[v.tone]}`}>
                      {v.status}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
