import { cache } from "react";
import { supabaseServer } from "@/lib/supabase-server";

// React-cached: dedupes the (network) auth validation so the layout and the
// page share a single getUser() per request instead of each paying for it.
export const currentUser = cache(async () => {
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  return user;
});
