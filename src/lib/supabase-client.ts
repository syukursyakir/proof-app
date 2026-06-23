import { createBrowserClient } from "@supabase/ssr";

// Cookie-based Supabase client for the browser (auth: sign in/out).
export function supabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
