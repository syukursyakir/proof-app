import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Sends "See a sample verdict" to the most recent real verdict (seed first).
export default async function SamplePage() {
  let candidateId: string | null = null;
  try {
    const supa = supabaseAdmin();
    const { data } = await supa
      .from("verdicts")
      .select("candidate_id")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    candidateId = data?.candidate_id ?? null;
  } catch {
    candidateId = null;
  }

  if (candidateId) redirect(`/candidates/${candidateId}`);

  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center px-6 text-center">
      <h1 className="text-2xl font-semibold">No sample yet</h1>
      <p className="mt-3 max-w-md text-muted">
        Load the demo data first by visiting <code>/api/seed</code>, then come back.
      </p>
      <div className="mt-6 flex gap-3">
        <Link
          href="/api/seed"
          className="rounded-full bg-accent px-6 py-2.5 font-medium text-white hover:bg-accent-soft"
        >
          Load sample data
        </Link>
        <Link href="/roles" className="rounded-full border border-border px-6 py-2.5">
          Go to roles
        </Link>
      </div>
    </div>
  );
}
