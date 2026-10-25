"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import {
  Bot,
  Zap,
  ShieldAlert,
  MessagesSquare,
  Ban,
  Gauge,
  AlertTriangle,
  Link2,
  Activity,
  ArrowRight,
  Eye,
  Building2,
} from "lucide-react";

import { cn } from "@/lib/utils";

import {
  useAdminStats,
  useGlobalAgents,
  useGlobalThreats,
} from "@/hooks/useAdmin";
import { useEvents } from "@/hooks/useEvents";

import { fmtTime, riskColor, trustColor } from "@/lib/promptguard/format";
import type { AgentStatus } from "@/lib/promptguard/types";

import {
  PageHeader,
  KpiCard,
  Panel,
  RiskBar,
  EmptyState,
} from "@/components/promptguard/ui-bits";

import { LiveEvents } from "@/components/promptguard/live-events";
import { AgentGraph } from "@/components/promptguard/agent-graph";

import {
  DecisionBadge,
  StatusBadge,
} from "@/components/promptguard/decision-badge";
function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn("h-2 w-2 rounded-full", color)} />
      <span>{label}</span>
    </div>
  );
}
function QuickLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:bg-accent">
      <Icon className="h-5 w-5 text-primary" />

      <span className="text-sm font-medium">{label}</span>

      <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
    </Link>
  );
}

export default function AdminDashboard() {
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("promptguard_token");

    if (!token) {
      router.replace("/admin/login");
      return;
    }

    setCheckingAuth(false);
  }, [router]);

  const { stats, loading: statsLoading, error: statsError } = useAdminStats();

  const { agents, loading: agentsLoading } = useGlobalAgents();

  const { threats, loading: threatsLoading } = useGlobalThreats();
  const { events } = useEvents();

  const loading = statsLoading || agentsLoading || threatsLoading;

  const kpis = stats ?? {
    total_companies: 0,
    total_agents: 0,
    total_requests: 0,
    total_blocked: 0,
    active_today: 0,
    threats_today: 0,
  };

  const topRisky = useMemo(() => {
    return [...agents]
      .sort((a, b) => a.trust_score - b.trust_score)
      .slice(0, 5);
  }, [agents]);

  const recentAttacks = useMemo(() => {
    return events.slice(0, 6);
  }, [events]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <ShieldAlert className="mx-auto mb-4 h-10 w-10 animate-pulse text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6">
        <h2 className="font-semibold text-red-500">Dashboard Error</h2>

        <p className="mt-2 text-sm text-muted-foreground">{statsError}</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Security Operations Center"
        description="Real-time overview of every agent, message and threat across the PromptGuard network."
        action={
          <span className="inline-flex items-center gap-2 rounded-full border border-safe/40 bg-safe/15 px-3 py-1 text-xs font-medium text-safe">
            <span
              className="size-1.5 animate-pulse rounded-full bg-safe"
              aria-hidden
            />
            Live · API Connected
          </span>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          label="Total Companies"
          value={kpis.total_companies}
          icon={Building2}
          tone="primary"
        />

        <KpiCard
          label="Total Agents"
          value={kpis.total_agents}
          icon={Bot}
          tone="safe"
        />

        <KpiCard
          label="Requests"
          value={kpis.total_requests}
          icon={MessagesSquare}
        />

        <KpiCard
          label="Blocked Requests"
          value={kpis.total_blocked}
          icon={Ban}
          tone="blocked"
        />

        <KpiCard
          label="Active Today"
          value={kpis.active_today}
          icon={Activity}
          tone="safe"
        />

        <KpiCard
          label="Threats Today"
          value={kpis.threats_today}
          icon={ShieldAlert}
          tone="review"
        />
      </div>

      {/* ================= Live Events + Risky Agents ================= */}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel
          title="Live Security Events"
          description="Streaming from WebSocket/API"
          className="lg:col-span-2"
          action={
            <Link
              href="/admin/events"
              className="text-xs font-medium text-primary hover:underline">
              View all
            </Link>
          }>
          <LiveEvents />
        </Panel>

        <Panel
          title="Top Risky Agents"
          action={
            <Link
              href="/admin/agents"
              className="text-xs font-medium text-primary hover:underline">
              Agents
            </Link>
          }>
          {topRisky.length === 0 ? (
            <EmptyState
              icon={Bot}
              title="No agents"
              description="No agents have been registered."
            />
          ) : (
            <ul className="flex flex-col gap-3">
              {topRisky.map((agent) => (
                <li key={agent.id} className="flex items-center gap-3">
                  <Link
                    href={`/admin/agents/${agent.agent_id}`}
                    className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium hover:underline">
                      {agent.agent_name}
                    </p>

                    <div className="mt-1 flex items-center gap-2">
                      <StatusBadge
                        status={normalizeAgentStatus(agent.status)}
                      />

                      <span
                        className={cn(
                          "text-xs tabular-nums",
                          trustColor(agent.trust_score),
                        )}>
                        {agent.trust_score}% trust
                      </span>
                    </div>
                  </Link>

                  <div className="flex flex-col items-end gap-1">
                    <RiskBar value={100 - agent.trust_score} />

                    <span className="text-[11px] text-muted-foreground">
                      {agent.total_messages} msgs
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* ================= Graph + Recent Attacks ================= */}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel
          title="Agent Communication Graph"
          description="Live topology"
          className="lg:col-span-2"
          action={
            <Link
              href="/admin/graph"
              className="text-xs font-medium text-primary hover:underline">
              Analytics
            </Link>
          }>
          <AgentGraph />

          <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <Legend color="bg-safe" label="Healthy" />

            <Legend color="bg-review" label="Warning" />

            <Legend color="bg-blocked" label="Blocked" />
          </div>
        </Panel>

        <Panel title="Recent Attacks" description="Latest detections">
          {recentAttacks.length === 0 ? (
            <EmptyState
              icon={ShieldAlert}
              title="No attacks detected"
              description="Everything looks clean."
            />
          ) : (
            <ul className="flex flex-col gap-3">
              {recentAttacks.map((event) => (
                <li
                  key={event.id}
                  className="rounded-xl border border-border bg-card p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {fmtTime(event.time)}
                    </span>

                    <DecisionBadge decision={event.decision} />
                  </div>

                  <p className="mt-2 font-medium">{event.agentName}</p>

                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {event.content}
                  </p>

                  <div className="mt-3 flex items-center justify-between">
                    <span
                      className={cn(
                        "text-xs font-medium",
                        riskColor(event.risk),
                      )}>
                      Risk {event.risk}
                    </span>

                    <Link
                      href={`/admin/chains?id=${event.chainId}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                      <Eye className="h-3 w-3" />
                      Details
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* ================= Quick Links ================= */}

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <QuickLink href="/admin/chains" icon={Link2} label="Inspect Chains" />

        <QuickLink
          href="/admin/events"
          icon={Activity}
          label="Security Events"
        />

        <QuickLink href="/admin/reports" icon={AlertTriangle} label="Reports" />
      </div>
    </div>
  );
}

function normalizeAgentStatus(status: string): AgentStatus {
  switch (status.toUpperCase()) {
    case "ACTIVE":
      return "ACTIVE";
    case "QUARANTINED":
      return "QUARANTINED";
    case "SUSPENDED":
    case "WARNING":
      return "WARNING";
    default:
      return "INACTIVE";
  }
}
