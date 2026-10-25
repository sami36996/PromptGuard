"use client";

import { useState } from "react";
import Link from "next/link";

import {
  Bot,
  Search,
  Eye,
  ShieldAlert,
  Play,
  KeyRound,
  MoreHorizontal,
  Plus,
  RefreshCw,
} from "lucide-react";

import { toast } from "sonner";

import { useAgents } from "@/hooks/useAgents";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  EmptyState,
  PageHeader,
  Panel,
  RiskBar,
} from "@/components/promptguard/ui-bits";

import { StatusBadge } from "@/components/promptguard/decision-badge";
import { ConfirmDialog } from "@/components/promptguard/confirm-dialog";

import { cn } from "@/lib/utils";
import { fmtDateTime, trustColor } from "@/lib/promptguard/format";
import {
  activateAgent,
  quarantineAgent,
  rotateAgentKey,
} from "@/lib/api/admin";
import type { Agent } from "@/lib/promptguard/types";

export default function AgentsPage() {
  const { agents, loading, error, refresh } = useAgents();

  const [query, setQuery] = useState("");

  const [confirm, setConfirm] = useState<{
    action: "quarantine" | "revoke";
    agent: Agent;
  } | null>(null);

  const filteredAgents = agents.filter((agent) => {
    const q = query.toLowerCase();

    return (
      (agent.name ?? "").toLowerCase().includes(q) ||
      (agent.type ?? "").toLowerCase().includes(q) ||
      (agent.organization ?? "").toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        Loading agents...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Agents"
        description="Every registered agent, its trust posture and enforcement controls."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={refresh}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>

            <Link href="/admin/agents/register">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Register Agent
              </Button>
            </Link>
          </div>
        }
      />

      <Panel
        title={`${filteredAgents.length} agents`}
        action={
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              className="pl-9 w-64"
              placeholder="Search agents..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        }>
        {filteredAgents.length === 0 ? (
          <EmptyState
            icon={Bot}
            title="No agents found"
            description="Register your first agent to begin monitoring."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-3 py-2 text-left">Agent</th>

                  <th className="px-3 py-2 text-left">Type</th>

                  <th className="px-3 py-2 text-left">Status</th>

                  <th className="px-3 py-2 text-left">Trust</th>

                  <th className="px-3 py-2 text-left">Risk</th>

                  <th className="px-3 py-2 text-left">Messages</th>

                  <th className="px-3 py-2 text-left">Created</th>

                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredAgents.map((a) => (
                  <tr
                    key={a.id}
                    className="border-b border-border/60 hover:bg-muted/30">
                    <td className="px-3 py-3">
                      <Link
                        href={`/admin/agents/${a.id}`}
                        className="font-medium hover:underline">
                        {a.name}
                      </Link>

                      <p className="text-xs text-muted-foreground">
                        {a.organization}
                      </p>
                    </td>

                    <td className="px-3 py-3">{a.type}</td>

                    <td className="px-3 py-3">
                      <StatusBadge status={a.status} />
                    </td>

                    <td
                      className={cn(
                        "px-3 py-3 font-medium",
                        trustColor(a.trust),
                      )}>
                      {a.trust}%
                    </td>

                    <td className="px-3 py-3 w-40">
                      <RiskBar value={a.risk} />
                    </td>

                    <td className="px-3 py-3">{a.messagesSent}</td>

                    <td className="px-3 py-3 text-xs text-muted-foreground">
                      {a.registeredAt
                        ? fmtDateTime(new Date(a.registeredAt).getTime())
                        : "—"}
                    </td>

                    <td className="px-3 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          }
                        />

                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            render={
                              <Link href={`/admin/agents/${a.id}`}>
                                <div className="flex items-center gap-2">
                                  <Eye className="h-4 w-4" />
                                  <span>View</span>
                                </div>
                              </Link>
                            }
                          />

                          {a.status === "QUARANTINED" ? (
                            <DropdownMenuItem
                              onClick={async () => {
                                try {
                                  await activateAgent(a.id);
                                  await refresh();
                                  toast.success("Agent activated");
                                } catch (requestError) {
                                  toast.error(
                                    requestError instanceof Error
                                      ? requestError.message
                                      : "Failed to activate agent",
                                  );
                                }
                              }}>
                              <Play className="mr-2 h-4 w-4" />
                              Activate
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() =>
                                setConfirm({
                                  action: "quarantine",
                                  agent: a,
                                })
                              }>
                              <ShieldAlert className="mr-2 h-4 w-4" />
                              Quarantine
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={() =>
                              setConfirm({
                                action: "revoke",
                                agent: a,
                              })
                            }>
                            <KeyRound className="mr-2 h-4 w-4" />
                            Rotate API Key
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <ConfirmDialog
        open={confirm?.action === "quarantine"}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
        title="Quarantine Agent"
        description={`Are you sure you want to quarantine ${confirm?.agent?.name}?`}
        confirmLabel="Quarantine"
        destructive
        onConfirm={async () => {
          if (!confirm?.agent?.id) return;
          await quarantineAgent(confirm.agent.id);
          await refresh();
          toast.success("Agent quarantined");
          setConfirm(null);
        }}
      />

      <ConfirmDialog
        open={confirm?.action === "revoke"}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
        title="Rotate API Key"
        description={`Generate a new API key for ${confirm?.agent?.name}?`}
        confirmLabel="Rotate"
        destructive
        onConfirm={async () => {
          if (!confirm?.agent?.id) return;
          const response = await rotateAgentKey(confirm.agent.id);
          await navigator.clipboard.writeText(response.api_key);
          toast.success("API key rotated and copied");
          setConfirm(null);
        }}
      />
    </div>
  );
}
