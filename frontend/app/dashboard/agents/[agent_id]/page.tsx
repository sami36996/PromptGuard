"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  Bot,
  KeyRound,
  Settings,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

import { getAgent } from "@/lib/api/agents";
import type { AgentDetail } from "@/lib/types/agent";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AgentDetailPage() {
  const params = useParams();
  const agentId = String(params.agent_id);

  const [agent, setAgent] = useState<AgentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAgent() {
      try {
        const data = await getAgent(agentId);
        setAgent(data);
      } catch (error) {
        console.error("Failed to load agent:", error);
      } finally {
        setLoading(false);
      }
    }

    loadAgent();
  }, [agentId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <Card key={item}>
              <CardContent className="p-6">
                <div className="h-20 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          render={<Link href="/dashboard/agents" />}
        >
            <ArrowLeft className="mr-2 size-4" />
            Back to Agents
        </Button>

        <Card>
          <CardContent className="p-8 text-center">
            <Bot className="mx-auto mb-4 size-10 text-muted-foreground" />

            <h2 className="font-semibold">
              Agent not found
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              The requested agent could not be loaded.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = String(agent.status).toUpperCase();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="icon"
            render={<Link href="/dashboard/agents" />}
          >
              <ArrowLeft className="size-4" />
          </Button>

          <div className="flex items-start gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Bot className="size-6" />
            </div>

            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold">
                  {agent.name}
                </h1>

                <Badge
                  variant={
                    status === "ACTIVE"
                      ? "default"
                      : "secondary"
                  }
                >
                  {status}
                </Badge>
              </div>

              <p className="mt-1 font-mono text-xs text-muted-foreground">
                {agent.id}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            render={
              <Link href="/dashboard/api-keys" />
            }
          >
              <KeyRound className="mr-2 size-4" />
              API Key
          </Button>

          <Button
            variant="outline"
            render={
              <Link href="/dashboard/settings" />
            }
          >
              <Settings className="mr-2 size-4" />
              Settings
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Trust Score"
          value={`${agent.trust}%`}
          icon={ShieldCheck}
        />

        <MetricCard
          title="Risk Score"
          value={agent.risk}
          icon={ShieldAlert}
        />

        <MetricCard
          title="Messages Sent"
          value={agent.messagesSent}
          icon={Activity}
        />

        <MetricCard
          title="Status"
          value={status}
          icon={Bot}
        />
      </div>

      {/* Overview */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Agent Information</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <InfoRow
              label="Agent ID"
              value={agent.id}
              mono
            />

            <InfoRow
              label="Name"
              value={agent.name}
            />

            <InfoRow
              label="Type"
              value={agent.type || "Not available"}
            />

            <InfoRow
              label="Organization"
              value={agent.organization || "Not available"}
            />

            <InfoRow
              label="Registered"
              value={formatDate(
                agent.registeredAt || agent.createdAt,
              )}
            />

            <InfoRow
              label="Last Seen"
              value={
                agent.lastSeen
                  ? formatDate(agent.lastSeen)
                  : "No activity recorded"
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security Posture</CardTitle>
          </CardHeader>

          <CardContent className="space-y-5">
            <ScoreBar
              label="Trust"
              value={agent.trust}
            />

            <ScoreBar
              label="Risk"
              value={agent.risk}
            />

            <div className="flex items-center justify-between border-t pt-4">
              <span className="text-sm text-muted-foreground">
                Quarantine Strikes
              </span>

              <span className="font-semibold">
                {agent.strikes ?? 0}
              </span>
            </div>

            {agent.quarantineReason && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                <p className="text-sm font-medium">
                  Quarantine Reason
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  {agent.quarantineReason}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>

        <CardContent>
          <p className="text-sm text-muted-foreground">
            {agent.description ||
              "No description has been provided for this agent."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-6">
        <div>
          <p className="text-sm text-muted-foreground">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold">
            {value}
          </p>
        </div>

        <div className="rounded-lg bg-primary/10 p-3 text-primary">
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-muted-foreground">
        {label}
      </span>

      <span
        className={`text-right text-sm ${
          mono ? "font-mono text-xs" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function ScoreBar({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-medium">{value}%</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{
            width: `${Math.min(100, Math.max(0, value))}%`,
          }}
        />
      </div>
    </div>
  );
}

function formatDate(value?: string) {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}