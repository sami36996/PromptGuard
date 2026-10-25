"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Bot,
  Link2,
  Activity,
  Network,
  SlidersHorizontal,
  Download,
  FileWarning,
  LogOut,
  ShieldCheck,
  X,
} from "lucide-react";
import { cn } from "@/lib/api/utils";
import { logout } from "@/lib/promptguard/auth";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/agents", label: "Agents", icon: Bot },
  { href: "/admin/chains", label: "Chains", icon: Link2 },
  { href: "/admin/events", label: "Events", icon: Activity },
  { href: "/admin/graph", label: "Graph", icon: Network },
  { href: "/admin/policy", label: "Policy", icon: SlidersHorizontal },
  { href: "/admin/exports", label: "Exports", icon: Download },
  { href: "/admin/reports", label: "Incident Reports", icon: FileWarning },
];

export function AdminSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push("/admin/login");
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-background/70 backdrop-blur-sm md:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform md:sticky md:top-0 md:h-dvh md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}>
        <div className="flex items-center justify-between gap-2 px-5 py-5">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/30">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight">
                PromptGuard
              </p>
              <p className="text-[11px] text-muted-foreground">SOC Console</p>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:text-foreground md:hidden"
            aria-label="Close menu">
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {nav.map((item) => {
            const ACTIVE = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  ACTIVE
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                )}>
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-blocked/15 hover:text-blocked">
            <LogOut className="size-4" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
