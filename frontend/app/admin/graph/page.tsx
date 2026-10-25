"use client";

import { useAgents } from "@/hooks/useAgents";
import {
  Network,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
} from "lucide-react";
import { PageHeader, Panel } from "@/components/promptguard/ui-bits";
import { AgentGraph } from "@/components/promptguard/agent-graph";
import { trustColor } from "@/lib/promptguard/format";
import { cn } from "@/lib/api/utils";

export default function GraphPage() {
  const { agents, loading } = useAgents();

  // Rank agents by traffic volume
  const busiest = [...agents]
    .sort(
      (a, b) =>
        b.messagesSent +
        b.messagesReceived -
        (a.messagesSent + a.messagesReceived),
    )
    .slice(0, 5);

  // Rank agents by risk
  const riskiest = [...agents]
    .sort((a, b) => b.risk - a.risk)
    .slice(0, 5);

  return (
    <div>
      <PageHeader
        title="Graph Analytics"
        description="Network topology of agent communication. Node color reflects health, edge thickness reflects risk."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Panel
          title="Agent communication network"
          className="min-h-[520px]"
        >
          <div className="h-[460px]">
            <AgentGraph height={460} />
          </div>
        </Panel>

        <div className="flex flex-col gap-6">

          {/* Busiest Agents */}
          <Panel
            title="Busiest nodes"
            description="By total messages"
          >
            {loading ? (
              <p className="text-sm text-muted-foreground">
                Loading agents...
              </p>
            ) : busiest.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No agents found.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {busiest.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center gap-3"
                  >
                    <span className="flex size-8 items-center justify-center rounded-lg bg-muted">
                      <Network className="size-4 text-muted-foreground" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {a.name}
                      </p>

                      <p className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-0.5">
                          <ArrowUpRight className="size-3" />
                          {a.messagesSent}
                        </span>

                        <span className="inline-flex items-center gap-0.5">
                          <ArrowDownRight className="size-3" />
                          {a.messagesReceived}
                        </span>
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {/* Highest Risk Agents */}
          <Panel
            title="Highest risk nodes"
            description="Potential threat sources"
          >
            {loading ? (
              <p className="text-sm text-muted-foreground">
                Loading agents...
              </p>
            ) : riskiest.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No agents found.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {riskiest.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center gap-3"
                  >
                    <span
                      className={cn(
                        "flex size-8 items-center justify-center rounded-lg",
                        a.risk >= 70
                          ? "bg-blocked/15 text-blocked"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      <ShieldAlert className="size-4" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {a.name}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        Risk {a.risk}
                      </p>
                    </div>

                    <span
                      className={cn(
                        "text-xs font-medium tabular-nums",
                        trustColor(a.trust),
                      )}
                    >
                      trust {a.trust}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

        </div>
      </div>
    </div>
  );
}