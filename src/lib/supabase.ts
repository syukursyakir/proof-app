import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;

// Browser-safe client (anon key). Import only in client components.
export const supabaseBrowser = () =>
  createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

// Server-only client (service role — bypasses RLS). NEVER import in client code.
export const supabaseAdmin = () =>
  createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
