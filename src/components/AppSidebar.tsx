"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SignOutButton from "@/components/SignOutButton";
import {
  DashboardIcon,
  RolesIcon,
  CandidatesIcon,
  SettingsIcon,
  CollapseIcon,
  PlusIcon,
} from "@/components/icons";

const NAV = [
  { href: "/dashboard", label: "Dashboard", Icon: DashboardIcon },
  { href: "/roles", label: "Roles", Icon: RolesIcon },
  { href: "/candidates", label: "Candidates", Icon: CandidatesIcon },
  { href: "/settings", label: "Settings", Icon: SettingsIcon },
];

export default function AppSidebar({ email }: { email?: string | null }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // Persist the collapsed preference.
  useEffect(() => {
    const v = localStorage.getItem("clarion.sidebar.collapsed");
    if (v === "1") setCollapsed(true);
  }, []);
  function toggle() {
    setCollapsed((c) => {
      localStorage.setItem("clarion.sidebar.collapsed", c ? "0" : "1");
      return !c;
    });
  }

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <aside
      className={`sticky top-0 flex h-screen shrink-0 flex-col border-r border-border bg-card/40 transition-[width] duration-200 ${
        collapsed ? "w-[68px]" : "w-60"
      }`}
    >
      {/* Brand */}
      <div className="flex h-16 items-center gap-2 px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="inline-block h-6 w-6 shrink-0 rounded-full bg-accent shadow-[0_0_18px_4px_rgba(109,94,248,0.5)]" />
          {!collapsed && <span>Clarion</span>}
        </Link>
      </div>

      {/* New role CTA */}
      <div className="px-3 pb-2">
        <Link
          href="/roles/new"
          title="New role"
          className={`flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-soft ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <PlusIcon className="h-4 w-4" />
          {!collapsed && <span>New role</span>}
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-2">
        {NAV.map(({ href, label, Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-accent/12 font-medium text-accent-soft"
                  : "text-foreground/70 hover:bg-card hover:text-foreground"
              } ${collapsed ? "justify-center" : ""}`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer: collapse + account */}
      <div className="space-y-2 border-t border-border/60 px-3 py-3">
        <button
          onClick={toggle}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground/60 transition-colors hover:bg-card hover:text-foreground ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <CollapseIcon className={`h-5 w-5 shrink-0 ${collapsed ? "rotate-180" : ""}`} />
          {!collapsed && <span>Collapse</span>}
        </button>
        {!collapsed && email && (
          <p className="truncate px-3 text-xs text-muted" title={email}>
            {email}
          </p>
        )}
        <div className={collapsed ? "flex justify-center" : ""}>
          <SignOutButton iconOnly={collapsed} />
        </div>
      </div>
    </aside>
  );
}
