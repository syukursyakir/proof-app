import { cookies } from "next/headers";
import { getUserOrg } from "@/lib/org";
import { currentUser } from "@/lib/auth";
import { Reveal } from "@/components/motion";
import SettingsForm from "@/components/SettingsForm";
import LangSwitcher from "@/components/LangSwitcher";
import { getDictionary, isSupportedLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const rawLocale = cookieStore.get("clarion-locale")?.value ?? "en";
  const siteLocale = isSupportedLocale(rawLocale) ? rawLocale : "en";
  const sd = await getDictionary(siteLocale);
  const e = sd.employer;

  const [user, org] = await Promise.all([currentUser(), getUserOrg()]);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-8 py-10">
      <Reveal>
        <h1 className="text-3xl font-semibold tracking-tight">{e.settingsP.title}</h1>
        <p className="mt-2 text-muted">{e.settingsP.subtitle}</p>
      </Reveal>

      <section className="mt-8 rounded-2xl border border-border bg-card/50 p-6">
        <h2 className="text-lg font-semibold">{e.settingsP.interfaceLang}</h2>
        <p className="mt-1 text-sm text-muted">{e.settingsP.interfaceLangDesc}</p>
        <div className="mt-4">
          <LangSwitcher />
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-card/50 p-6">
        <h2 className="text-lg font-semibold">{e.settingsP.workspace}</h2>
        <p className="mt-1 text-sm text-muted">
          {e.settingsP.workspaceDesc}
          {" "}(&ldquo;with{" "}
          <span className="text-foreground">{org?.name || "your company"}</span>
          &rdquo;).
        </p>
        <SettingsForm initialName={org?.name ?? ""} />
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-card/50 p-6">
        <h2 className="text-lg font-semibold">{e.settingsP.account}</h2>
        <p className="mt-2 text-sm text-muted">
          {e.settingsP.signedInAs}{" "}
          <span className="text-foreground">{user?.email ?? "—"}</span>
        </p>
      </section>
    </main>
  );
}
