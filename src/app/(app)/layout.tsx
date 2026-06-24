import { supabaseServer } from "@/lib/supabase-server";
import AppSidebar from "@/components/AppSidebar";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();

  return (
    <div className="flex min-h-screen">
      <AppSidebar email={user?.email} />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
