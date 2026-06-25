import Link from "next/link";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase-server";
import { Reveal, Stagger, Item } from "@/components/motion";
import RoleCodeBadge from "@/components/RoleCodeBadge";
import { genCode } from "@/lib/candidateToken";
import { getDictionary, isSupportedLocale } from "@/lib/i18n";
import type { Candidate, Role } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function RolesPage() {
  const sb = await supabaseServer();

  const cookieStore = await cookies();
  const rawLocale = cookieStore.get("clarion-locale")?.value ?? "en";
  const siteLocale = isSupportedLocale(rawLocale) ? rawLocale : "en";
  const sd = await getDictionary(siteLocale);
  const e = sd.employer;

  let roles: Role[] = [];
  let dbError: string | null = null;
  try {
    const { data, error } = await sb
      .from("roles")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("roles query error", error);
      dbError = "Couldn't reach the database. Please try refreshing.";
    } else {
      roles = (data as Role[]) ?? [];
    }
  } catch (err) {
    console.error("roles query exception", err);
    dbError = "Couldn't reach the database. Please try refreshing.";
  }

  const missing = roles.filter((r) => !r.join_code);
  if (missing.length > 0) {
    await Promise.all(
      missing.map(async (r) => {
        const code = genCode();
        await sb.from("roles").update({ join_code: code }).eq("id", r.id);
        r.join_code = code;
      }),
    );
  }

  const perRole = new Map<string, { total: number; review: number }>();
  if (roles.length > 0) {
    const { data } = await sb
      .from("candidates")
      .select("role_id, status")
      .in("role_id", roles.map((r) => r.id));
    for (const c of (data as Candidate[]) ?? []) {
      const t = perRole.get(c.role_id) ?? { total: 0, review: 0 };
      t.total += 1;
      if (c.status === "completed") t.review += 1;
      perRole.set(c.role_id, t);
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-8 py-10">
      <Reveal>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{e.rolesP.title}</h1>
            <p className="mt-2 text-muted">{e.rolesP.subtitle}</p>
          </div>
          <Link
            href="/roles/new"
            className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-white hover:bg-accent-soft"
          >
            {e.rolesP.newRole}
          </Link>
        </div>
      </Reveal>

      {dbError && (
        <div className="mt-8 rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-4 text-sm text-yellow-800">
          {dbError}
        </div>
      )}

      {!dbError && roles.length === 0 && (
        <div className="mt-10 rounded-2xl border border-dashed border-border p-12 text-center">
          <p className="text-muted">{e.rolesP.noRoles}</p>
          <Link
            href="/roles/new"
            className="mt-4 inline-block rounded-full bg-accent px-6 py-2.5 font-medium text-white hover:bg-accent-soft"
          >
            {e.rolesP.buildFirst}
          </Link>
        </div>
      )}

      <Stagger className="mt-8 grid gap-4 sm:grid-cols-2">
        {roles.map((r) => {
          const t = perRole.get(r.id);
          return (
            <Item key={r.id} className="h-full">
              <div className="lift flex h-full flex-col rounded-2xl border border-border bg-card/50 p-6">
                <Link href={`/roles/${r.id}`} className="block">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-semibold hover:text-accent-soft">
                      {r.title}
                    </h3>
                    {t && t.review > 0 && (
                      <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                        {t.review} {e.rolesP.toReview}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-muted">
                    {r.description_raw ?? "—"}
                  </p>
                  <p className="mt-4 text-xs text-muted">
                    {t?.total ?? 0} candidate{(t?.total ?? 0) === 1 ? "" : "s"} ·{" "}
                    {r.rubric?.length ?? 0} criteria ·{" "}
                    {r.interview_questions?.length ?? 0} questions
                  </p>
                </Link>
                {r.join_code && (
                  <div className="mt-auto">
                    <RoleCodeBadge code={r.join_code} roleTitle={r.title} />
                  </div>
                )}
              </div>
            </Item>
          );
        })}
      </Stagger>
    </main>
  );
}
