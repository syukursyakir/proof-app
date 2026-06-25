import { getUserOrg } from "@/lib/org";
import { currentUser } from "@/lib/auth";
import { Reveal } from "@/components/motion";
import SettingsForm from "@/components/SettingsForm";
import LangSwitcher from "@/components/LangSwitcher";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  // user + org in parallel (org no longer waits on a separate auth call).
  const [user, org] = await Promise.all([currentUser(), getUserOrg()]);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-8 py-10">
      <Reveal>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-2 text-muted">Your workspace and account.</p>
      </Reveal>

      <section className="mt-8 rounded-2xl border border-border bg-card/50 p-6">
        <h2 className="text-lg font-semibold">Interface language</h2>
        <p className="mt-1 text-sm text-muted">
          Changes the language of this dashboard and the public landing page.
          The candidate assessment language is set per-role.
        </p>
        <div className="mt-4">
          <LangSwitcher />
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-card/50 p-6">
        <h2 className="text-lg font-semibold">Workspace</h2>
        <p className="mt-1 text-sm text-muted">
          Your company name appears to candidates on their assessment
          (&ldquo;with <span className="text-foreground">{org?.name || "your company"}</span>&rdquo;).
        </p>
        <SettingsForm initialName={org?.name ?? ""} />
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-card/50 p-6">
        <h2 className="text-lg font-semibold">Account</h2>
        <p className="mt-2 text-sm text-muted">
          Signed in as <span className="text-foreground">{user?.email ?? "—"}</span>
        </p>
      </section>
    </main>
  );
}
