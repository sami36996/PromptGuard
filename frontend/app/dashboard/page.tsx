"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Activity,
  ArrowRight,
  Bot,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

import { useCompany } from "@/hooks/useCompany";
import {
  getDashboardOverview,
  type DashboardOverview,
} from "@/lib/api/dashboard";

import {
  KpiCard,
  PageHeader,
  Panel,
} from "@/components/promptguard/ui-bits";

export default function DashboardPage() {
  const {
    company,
    loading,
    error,
  } = useCompany();
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  useEffect(() => {
    getDashboardOverview()
      .then(setOverview)
      .catch((requestError: unknown) => {
        setOverviewError(
          requestError instanceof Error
            ? requestError.message
            : "Failed to load dashboard statistics",
        );
      });
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        Loading dashboard...
      </div>
    );
  }

  if (error || overviewError) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-red-500">
        {error ?? overviewError}
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={`Welcome to ${company?.name ?? "PromptGuard"}`}
        description="Protect, monitor, and control your AI agents."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Company status"
          value={
            company?.is_active
              ? "Active"
              : "Suspended"
          }
          icon={ShieldCheck}
          tone={
            company?.is_active
              ? "safe"
              : "blocked"
          }
        />

        <KpiCard
          label="AI agents"
          value={overview?.total_agents ?? 0}
          icon={Bot}
        />

        <KpiCard
          label="Requests"
          value={overview?.total_messages ?? 0}
          icon={Activity}
        />

        <KpiCard
          label="Threats"
          value={
            (overview?.blocked_prompts ?? 0) +
            (overview?.review_prompts ?? 0)
          }
          icon={ShieldAlert}
          tone="review"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel
          title="Get started"
          description="Connect your AI systems to PromptGuard."
        >
          <div className="space-y-3">
            <DashboardLink
              href="/dashboard/agents"
              icon={Bot}
              title="Register an AI agent"
              description="Create an agent and generate its API credentials."
            />

            <DashboardLink
              href="/dashboard/api-keys"
              icon={ShieldCheck}
              title="Manage API keys"
              description="Create and manage integration credentials."
            />
          </div>
        </Panel>

        <Panel
          title="Security monitoring"
          description="Review your company's AI security posture."
        >
          <div className="space-y-3">
            <DashboardLink
              href="/dashboard/logs"
              icon={Activity}
              title="View security events"
              description="Inspect requests, decisions, and detections."
            />

            <DashboardLink
              href="/dashboard/usage"
              icon={ShieldAlert}
              title="View analytics"
              description="Analyze risk, threats, and agent behavior."
            />
          </div>
        </Panel>
      </div>
    </div>
  );
}

function DashboardLink({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: typeof Bot;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl border border-border p-4 transition-colors hover:border-primary/50 hover:bg-muted/30"
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-5" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-medium">
          {title}
        </p>

        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      </div>

      <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
    </Link>
  );
}