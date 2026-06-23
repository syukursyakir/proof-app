import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import AssessmentForm from "@/components/AssessmentForm";
import type { Role } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function RolePage({
  params,
}: {
  params: Promise<{ roleId: string }>;
}) {
  const { roleId } = await params;
  const supa = supabaseAdmin();
  const { data, error } = await supa
    .from("roles")
    .select("*")
    .eq("id", roleId)
    .single();

  if (error || !data) notFound();
  const role = data as Role;

  return (
    <div className="flex flex-col flex-1">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <Link href="/roles" className="text-sm text-muted hover:text-foreground">
            ← Roles
          </Link>
          <span className="text-sm font-medium">Edit role</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <AssessmentForm
          mode="edit"
          roleId={role.id}
          initial={{
            title: role.title,
            description_raw: role.description_raw,
            rubric: role.rubric ?? [],
            test_questions: role.test_questions ?? [],
            interview_questions: role.interview_questions ?? [],
            test_enabled: role.test_enabled,
          }}
        />
      </main>
    </div>
  );
}
