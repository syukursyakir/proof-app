"use client";

import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase-client";

export default function SignOutButton() {
  const router = useRouter();
  async function signOut() {
    await supabaseClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }
  return (
    <button
      onClick={signOut}
      className="rounded-full border border-border px-4 py-2 text-sm hover:border-accent"
    >
      Sign out
    </button>
  );
}
