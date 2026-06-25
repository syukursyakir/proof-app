import Link from "next/link";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase-server";
import { currentUser } from "@/lib/auth";
import { Reveal, Stagger, Item } from "@/components/motion";
import { getDictionary, isSupportedLocale } from "@/lib/i18n";
import type { Candidate, Role } from "@/lib/types";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const sb = await supabaseServer();
  const user = await currentUser();

  const cookieStore = await cookies();
  const rawLocale = cookieStore.get("clarion-locale")?.value ?? "en";
  const siteLocale = isSupportedLocale(rawLocale) ? rawLocale : "en";
  const sd = await getDictionary(siteLocale);
  const e = sd.employer;

  let roles: Role[] = [];
  let dbError: string | null = null;
  try {
    const { data, error } = await sb.from("roles").select("*");
    if (error) {
      console.error("dashboard roles query error", error);
      dbError = "Couldn't reach the database. Please try refreshing.";
    } else {
      roles = (data as Role[]) ?? [];
    }
  } catch (err) {
    console.error("dashboard roles query exception", err);
    dbError = "Couldn't reach the database. Please try refreshing.";
  }

  let candidates: Candidate[] = [];
  if (roles.length > 0) {
    const { data } = await sb
      .from("candidates")
      .select("id, role_id, name, status, created_at")
      .in("role_id", roles.map((r) => r.id))
      .order("created_at", { ascending: false });
    candidates = (data as Candidate[]) ?? [];
  }

  const roleTitle = new Map(roles.map((r) => [r.id, r.title]));
  const done = candidates.filter((c) =>
    ["advanced", "rejected", "completed"].includes(c.status),
  );
  const needsReview = candidates.filter((c) => c.status === "completed");

  const stats = [
    { label: e.dash.roles, value: roles.length },
    { label: e.dash.candidates, value: candidates.length },
    { label: e.dash.interviewed, value: done.length },
    { label: e.dash.awaitingReview, value: needsReview.length, accent: true },
  ];

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-8 py-10">
      <Reveal>
        <h1 className="text-3xl font-semibold tracking-tight">{e.dash.title}</h1>
        <p className="mt-2 text-muted">
          {user?.email ? `${e.settingsP.signedInAs} ${user.email}. ` : ""}
          {e.dash.subtitle}
        </p>
      </Reveal>

      {dbError && (
        <div className="mt-8 rounded-xl border border-accent-warm/40 bg-accent-warm/10 p-4 text-sm text-accent-warm-soft">
          {dbError}
        </div>
      )}

      <Stagger className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => {
          const highlight = s.accent && s.value > 0;
          return (
            <Item key={s.label}>
              <Card padding="sm" tint={highlight ? "warning" : 50}>
                <div
                  className={`tnum text-3xl font-semibold ${
                    highlight ? "text-accent-warm-soft" : "text-foreground"
                  }`}
                >
                  {s.value}
                </div>
                <div className="mt-1 text-sm text-muted">{s.label}</div>
              </Card>
            </Item>
          );
        })}
      </Stagger>

      {roles.length === 0 && !dbError && (
        <Card border="dashed" padding="lg" className="mt-10 text-center">
          <p className="text-muted">{e.dash.noRoles}</p>
          <Link
            href="/roles/new"
            className="mt-4 inline-block rounded-full bg-accent px-6 py-2.5 font-medium text-white hover:bg-accent-soft"
          >
            {e.dash.buildFirst}
          </Link>
        </Card>
      )}

      {needsReview.length > 0 ? (
        <Reveal className="mt-10">
          <h2 className="text-lg font-semibold">{e.dash.needsReview}</h2>
          <div className="mt-4 space-y-2">
            {needsReview.map((c) => (
              <Link
                key={c.id}
                href={`/candidates/${c.id}`}
                className="lift flex items-center justify-between rounded-xl border border-border bg-card/50 px-4 py-3 hover:border-accent"
              >
                <div>
                  <span className="font-medium">{c.name ?? "Candidate"}</span>
                  <span className="ml-3 text-sm text-muted">
                    {roleTitle.get(c.role_id) ?? "—"}
                  </span>
                </div>
                <span className="flex items-center gap-3">
                  <Badge tone="warning">{e.dash.awaitingReview}</Badge>
                  <span className="text-sm font-medium text-accent-soft">{e.dash.reviewArrow}</span>
                </span>
              </Link>
            ))}
          </div>
        </Reveal>
      ) : (
        roles.length > 0 && (
          <p className="mt-10 rounded-xl border border-border bg-card/40 px-4 py-6 text-center text-sm text-muted">
            {e.dash.nothingWaiting}
          </p>
        )
      )}
    </main>
  );
}
