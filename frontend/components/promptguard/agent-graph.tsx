"use client";

import Link from "next/link";
import { Bot, ArrowRight } from "lucide-react";
import { useAgents } from "@/hooks/useAgents";
import { cn } from "@/lib/utils";

interface AgentGraphProps {
  height?: number;
}

const statusColors = {
  ACTIVE: "bg-green-500",
  QUARANTINED: "bg-red-500",
  INACTIVE: "bg-gray-400",
  WARNING: "bg-yellow-500",
};

export function AgentGraph({ height = 360 }: AgentGraphProps) {
  const { agents, loading, error } = useAgents();

  if (loading) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center rounded-xl border border-border">
        Loading graph...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10">
        <div className="text-center">
          <p className="font-semibold text-red-500">Failed to load graph</p>

          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!agents || agents.length === 0) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center rounded-xl border border-dashed border-border">
        <div className="text-center">
          <Bot className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />

          <p className="font-medium">No agents registered</p>

          <p className="text-sm text-muted-foreground">
            Register your first AI agent.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ height }}
      className="overflow-auto rounded-xl border border-border bg-muted/10 p-8">
      <div className="flex min-w-max items-center justify-center gap-4">
        {agents.map((agent, index) => (
          <div key={agent.id} className="flex items-center gap-4">
            {/* Agent Node */}
            <Link
              href={`/admin/agents/${agent.id}`}
              className="group w-48 rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:border-primary hover:shadow-md">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full",
                    agent.status === "ACTIVE"
                      ? "bg-green-500/15 text-green-500"
                      : agent.status === "QUARANTINED"
                        ? "bg-red-500/15 text-red-500"
                        : agent.status === "WARNING"
                          ? "bg-yellow-500/15 text-yellow-500"
                          : "bg-gray-500/15 text-gray-500",
                  )}>
                  <Bot className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold group-hover:text-primary">
                    {agent.name}
                  </p>

                  <p className="truncate text-xs text-muted-foreground">
                    {agent.type}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-md bg-muted p-2">
                  <p className="text-muted-foreground">Trust</p>

                  <p className="font-semibold text-green-500">{agent.trust}%</p>
                </div>

                <div className="rounded-md bg-muted p-2">
                  <p className="text-muted-foreground">Risk</p>

                  <p className="font-semibold text-red-500">{agent.risk}%</p>
                </div>
              </div>
            </Link>

            {/* Connection */}
            {index !== agents.length - 1 && (
              <div className="flex items-center gap-1">
                <div className="h-px w-12 bg-border" />
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <div className="h-px w-12 bg-border" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
