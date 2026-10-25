"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bot,
  Plus,
  ShieldCheck,
  ShieldAlert,
  Activity,
} from "lucide-react";

import { getAgents } from "@/lib/api/agents";
import type { AgentListItem } from "@/lib/types/agent";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAgents() {
      try {
        const data = await getAgents();
        setAgents(data);
      } catch (error) {
        console.error("Failed to load agents:", error);
      } finally {
        setLoading(false);
      }
    }

    loadAgents();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Agents
          </h1>

          <p className="text-muted-foreground">
            Monitor and manage AI agents connected to your organization.
          </p>
        </div>

        <Button render={<Link href="/dashboard/agents/register" />}>
            <Plus className="mr-2 size-4" />
            Register Agent
        </Button>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          label="Total Agents"
          value={agents.length}
          icon={Bot}
        />

        <SummaryCard
          label="Active Agents"
          value={agents.filter((agent) => agent.status === "ACTIVE").length}
          icon={ShieldCheck}
        />

        <SummaryCard
          label="Average Trust"
          value={
            agents.length > 0
              ? `${Math.round(
                  agents.reduce((sum, agent) => sum + agent.trust, 0) /
                    agents.length,
                )}%`
              : "0%"
          }
          icon={Activity}
        />
      </div>

      {/* Agent List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-sm text-muted-foreground">
              Loading agents...
            </div>
          ) : agents.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <Bot className="mb-4 size-10 text-muted-foreground" />

              <h3 className="font-semibold">
                No agents registered
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                Register your first AI agent to start monitoring its security.
              </p>

              <Button
                render={<Link href="/dashboard/agents/register" />}
                className="mt-4"
              >
                  <Plus className="mr-2 size-4" />
                  Register Agent
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {agents.map((agent) => (
                <AgentRow key={agent.id} agent={agent} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AgentRow({ agent }: { agent: AgentListItem }) {
  const status = agent.status.toUpperCase();

  return (
    <div className="flex flex-col gap-4 p-6 transition-colors hover:bg-muted/30 md:flex-row md:items-center md:justify-between">
      {/* Identity */}
      <div className="flex items-center gap-4">
        <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Bot className="size-5" />
        </div>

        <div>
          <Link
            href={`/dashboard/agents/${agent.id}`}
            className="font-medium hover:underline"
          >
            {agent.name}
          </Link>

          <p className="font-mono text-xs text-muted-foreground">
            {agent.id}
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-8 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">
            Trust
          </p>

          <p className="font-semibold">
            {agent.trust}%
          </p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">
            Risk
          </p>

          <div className="flex items-center gap-1">
            {agent.risk > 0 && (
              <ShieldAlert className="size-3 text-destructive" />
            )}

            <p className="font-semibold">
              {agent.risk}
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">
            Messages
          </p>

          <p className="font-semibold">
            {agent.messagesSent}
          </p>
        </div>
      </div>

      {/* Status */}
      <Badge
        variant={status === "ACTIVE" ? "default" : "secondary"}
      >
        {status}
      </Badge>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div className="rounded-lg bg-primary/10 p-3 text-primary">
          <Icon className="size-5" />
        </div>

        <div>
          <p className="text-sm text-muted-foreground">
            {label}
          </p>

          <p className="text-2xl font-bold">
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}