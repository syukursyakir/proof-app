"use client";

import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase-client";
import { LogOutIcon } from "@/components/icons";

export default function SignOutButton({ iconOnly = false }: { iconOnly?: boolean }) {
  const router = useRouter();
  async function signOut() {
    await supabaseClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }
  if (iconOnly) {
    return (
      <button
        onClick={signOut}
        title="Sign out"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground/60 hover:bg-card hover:text-foreground"
      >
        <LogOutIcon className="h-5 w-5" />
      </button>
    );
  }
  return (
    <button
      onClick={signOut}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground/70 transition-colors hover:bg-card hover:text-foreground"
    >
      <LogOutIcon className="h-5 w-5 shrink-0" />
      Sign out
    </button>
  );
}
