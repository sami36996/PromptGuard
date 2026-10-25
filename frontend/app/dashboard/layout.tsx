"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  Bot,
  FileText,
  KeyRound,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Network,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { authApi } from "@/lib/api/auth";
import { getMyCompany } from "@/lib/api/company";
import { getMe } from "@/lib/api/users";

const navigation = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: LayoutDashboard,
  },
  {
    href: "/dashboard/agents",
    label: "Agents",
    icon: Bot,
  },
  {
    href: "/dashboard/testing/user-to-agent",
    label: "User → Agent",
    icon: MessageSquare,
  },
  {
    href: "/dashboard/testing/agent-to-agent",
    label: "Agent → Agent",
    icon: Network,
  },
  {
    href: "/dashboard/logs",
    label: "Security Logs",
    icon: Activity,
  },
  {
    href: "/dashboard/api-keys",
    label: "API Keys",
    icon: KeyRound,
  },
  {
    href: "/dashboard/policies",
    label: "Policies",
    icon: ShieldCheck,
  },
  {
    href: "/dashboard/usage",
    label: "Usage",
    icon: FileText,
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    icon: Settings,
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [administratorName, setAdministratorName] = useState(
    "Company Administrator",
  );
  const [organizationName, setOrganizationName] = useState("Organization");

  useEffect(() => {
    if (!authApi.isAuthenticated()) {
      router.replace("/login");
      return;
    }

    async function loadIdentity() {
      try {
        const [user, company] = await Promise.all([
          getMe(),
          getMyCompany(),
        ]);
        setAdministratorName(user.full_name || user.email);
        setOrganizationName(company.name);
      } catch {
        // Keep the existing labels when identity lookups fail.
      } finally {
        setReady(true);
      }
    }

    void loadIdentity();
  }, [router]);

  function handleLogout() {
    authApi.logout();
    router.replace("/login");
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Securing session...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-card lg:block">
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center gap-3 border-b px-6">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="size-5" />
            </div>

            <div>
              <p className="font-semibold">PromptGuard</p>
              <p className="text-xs text-muted-foreground">
                Company Portal
              </p>
            </div>
          </div>

          <nav className="flex-1 space-y-1 p-4">
            {navigation.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t p-4">
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <LogOut className="size-4" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="flex h-16 items-center justify-between border-b bg-card px-6">
          <div>
            <p className="text-sm font-medium">
              Company Control Center
            </p>

            <p className="text-xs text-muted-foreground">
              AI Security Gateway
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">
                {administratorName}
              </p>

              <p className="text-xs text-muted-foreground">
                {organizationName}
              </p>
            </div>

            <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {administratorName
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0]?.toUpperCase())
                .join("") || "CA"}
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}