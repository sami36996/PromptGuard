"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  MessageSquare,
  ShieldAlert,
  ShieldCheck,
  Users,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getDashboardOverview,
  getRequestStats,
  type DashboardOverview,
  type RequestStats,
} from "@/lib/api/dashboard";
import { getLogs, type PromptLog } from "@/lib/api/logs";

const quickActions = [
  {
    href: "/dashboard/agents/register",
    title: "Register Agent",
    description: "Add a new AI agent to your organization.",
    icon: Bot,
  },
  {
    href: "/dashboard/testing/user-to-agent",
    title: "Test User → Agent",
    description: "Send a user prompt through PromptGuard.",
    icon: MessageSquare,
  },
  {
    href: "/dashboard/testing/agent-to-agent",
    title: "Test Agent → Agent",
    description: "Test secure agent-to-agent communication.",
    icon: Users,
  },
  {
    href: "/dashboard/api-keys",
    title: "Manage API Keys",
    description: "View and manage your integration credentials.",
    icon: ShieldCheck,
  },
];

export default function DashboardPage() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [requests, setRequests] = useState<RequestStats | null>(null);
  const [logs, setLogs] = useState<PromptLog[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      getDashboardOverview(),
      getRequestStats(),
      getLogs(),
    ])
      .then(([overviewData, requestData, logData]) => {
        setOverview(overviewData);
        setRequests(requestData);
        setLogs(logData);
      })
      .catch((requestError: unknown) => {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Failed to load dashboard data",
        );
      });
  }, []);

  const stats = [
    {
      label: "Total Agents",
      value: overview?.total_agents ?? "—",
      icon: Bot,
      description: "Registered AI agents",
    },
    {
      label: "Active Agents",
      value: overview?.active_agents ?? "—",
      icon: Activity,
      description: "Currently operational",
    },
    {
      label: "Total Requests",
      value: requests?.total_requests ?? "—",
      icon: MessageSquare,
      description: "Prompts inspected",
    },
    {
      label: "Blocked Requests",
      value: requests?.blocked ?? "—",
      icon: ShieldAlert,
      description: "Threats blocked",
    },
  ];

  return (
    <main className="space-y-8">
      <section>
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm text-muted-foreground">
              Company Control Center
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              Dashboard
            </h1>

            <p className="mt-2 text-muted-foreground">
              Monitor your AI agents, security activity, and PromptGuard
              protection.
            </p>
          </div>

          <Button render={<Link href="/dashboard/agents/register" />}>
              <Bot className="mr-2 size-4" />
              Register Agent
          </Button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>

                <Icon className="size-5 text-primary" />
              </CardHeader>

              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>

                <p className="mt-1 text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Security Overview</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <SecurityMetric
                icon={CheckCircle2}
                label="Allowed"
                value={requests?.allowed ?? "—"}
              />

              <SecurityMetric
                icon={AlertTriangle}
                label="Under Review"
                value={requests?.review ?? "—"}
              />

              <SecurityMetric
                icon={ShieldAlert}
                label="Blocked"
                value={requests?.blocked ?? "—"}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <StatusRow
              label="PromptGuard Gateway"
              status={error ? "Unavailable" : overview ? "Connected" : "Loading"}
            />

            <StatusRow
              label="Threat Detection"
              status={error ? "Unavailable" : requests ? "Active" : "Loading"}
            />

            <StatusRow
              label="Agent Protection"
              status={error ? "Unavailable" : overview ? "Active" : "Loading"}
            />
          </CardContent>
        </Card>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Quick Actions</h2>

            <p className="text-sm text-muted-foreground">
              Common actions for managing your PromptGuard deployment.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon;

            return (
              <Link
                key={action.href}
                href={action.href}
                className="group"
              >
                <Card className="h-full transition-colors group-hover:border-primary/50">
                  <CardContent className="p-5">
                    <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </div>

                    <h3 className="font-semibold">
                      {action.title}
                    </h3>

                    <p className="mt-2 text-sm text-muted-foreground">
                      {action.description}
                    </p>

                    <div className="mt-4 flex items-center text-sm font-medium text-primary">
                      Open
                      <ArrowRight className="ml-1 size-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Recent Security Activity</CardTitle>
        </CardHeader>

        <CardContent>
          {logs.length === 0 ? (
          <div className="flex min-h-40 items-center justify-center text-center">
            <div>
              <ShieldCheck className="mx-auto size-10 text-muted-foreground/50" />

              <p className="mt-3 font-medium">
                No security activity yet
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Security events will appear here when your agents begin
                processing requests.
              </p>
            </div>
          </div>
          ) : (
            <div className="divide-y">
              {logs.slice(0, 5).map((log) => (
                <div key={log.id} className="py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm">{log.prompt}</p>
                    <span className="text-xs font-medium">
                      {log.decision}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Risk {log.risk_score}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

function SecurityMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CheckCircle2;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg border p-4">
      <Icon className="size-5 text-muted-foreground" />

      <p className="mt-3 text-2xl font-bold">{value}</p>

      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function StatusRow({
  label,
  status,
}: {
  label: string;
  status: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>

      <span className="flex items-center gap-2 text-sm text-green-600">
        <span className="size-2 rounded-full bg-green-500" />
        {status}
      </span>
    </div>
  );
}