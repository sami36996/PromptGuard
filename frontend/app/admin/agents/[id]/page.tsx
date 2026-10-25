"use client";
import { useMounted } from "@/lib/promptguard/hooks";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ShieldAlert,
  Play,
  KeyRound,
  Trash2,
  Copy,
  Check,
  ArrowUpRight,
  ArrowDownRight,
  Ban,
} from "lucide-react";
import { toast } from "sonner";
import {
  getGlobalAgents,
  activateAgent,
  quarantineAgent,
  revokeAgent,
  rotateAgentKey,
} from "@/lib/api/admin";
import { useEvents } from "@/hooks/useEvents";
import { fmtDateTime, trustColor, riskColor } from "@/lib/promptguard/format";
import {
  PageHeader,
  Panel,
  KpiCard,
  EmptyState,
} from "@/components/promptguard/ui-bits";
import {
  StatusBadge,
  DecisionBadge,
} from "@/components/promptguard/decision-badge";
import { ConfirmDialog } from "@/components/promptguard/confirm-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/api/utils";
import type { AgentDetail } from "@/lib/types/agent";
import type { AgentStatus } from "@/lib/promptguard/types";



export default function AgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const mounted = useMounted();
  const router = useRouter();
  const { events: allEvents } = useEvents();
  const [agent, setAgent] = useState<AgentDetail | null>(null);
  const [internalAgentId, setInternalAgentId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [confirm, setConfirm] = useState<"quarantine" | "delete" | null>(null);

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadAgent() {
      try {
        setLoading(true);
        setError(null);

        const agents = await getGlobalAgents();
        const data = agents.find((item) => item.agent_id === id);
        if (!data) {
          setAgent(null);
          return;
        }
        setInternalAgentId(data.id);
        setAgent({
          id: data.agent_id,
          agentId: data.agent_id,
          name: data.agent_name,
          type: data.agent_type,
          organization: data.company_name,
          status: normalizeStatus(data.status),
          trust: data.trust_score,
          risk: Math.max(0, 100 - data.trust_score),
          messagesSent: data.total_messages,
          messagesReceived: 0,
          blocked: data.blocked_messages,
          createdAt: data.created_at,
          registeredAt: data.created_at,
          lastSeen: data.last_seen,
          strikes: 0,
        });
      } catch (err) {
        console.error("Failed to load agent:", err);
        setError("Failed to load agent");
      } finally {
        setLoading(false);
      }
    }

    loadAgent();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        Agent not found.
      </div>
    );
  }

  const events = allEvents
    .filter((event) => event.agentId === String(internalAgentId))
    .slice(0, 12);

  function copyKey() {
    if (!agent?.apiKey) return;
    navigator.clipboard.writeText(agent.apiKey);
    setCopied(true);
    toast.success("API key copied");
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div>
      <Link
        href="/admin/agents"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Agents
      </Link>

      <PageHeader
        title={agent.name}
        description={`${agent.type} · ${agent.organization}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={agent.status} />
            {agent.status === "QUARANTINED" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    await activateAgent(agent.id);
                    setAgent((current) =>
                      current ? { ...current, status: "ACTIVE" } : current,
                    );
                    toast.success(`${agent.name} reactivated`);
                  } catch (requestError) {
                    toast.error(
                      requestError instanceof Error
                        ? requestError.message
                        : "Failed to activate agent",
                    );
                  }
                }}>
                <Play className="size-4" /> Activate
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirm("quarantine")}>
                <ShieldAlert className="size-4" /> Quarantine
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                rotateAgentKey(agent.id)
                  .then(async (response) => {
                    await navigator.clipboard.writeText(response.api_key);
                    setAgent((current) =>
                      current
                        ? { ...current, apiKey: response.api_key }
                        : current,
                    );
                    toast.success("API key rotated and copied");
                  })
                  .catch((requestError: unknown) => {
                    toast.error(
                      requestError instanceof Error
                        ? requestError.message
                        : "Failed to rotate API key",
                    );
                  });
              }}>
              <KeyRound className="size-4" /> Rotate key
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setConfirm("delete")}>
              <Trash2 className="size-4" /> Revoke
            </Button>
          </div>
        }
      />

      {agent.status === "QUARANTINED" && agent.quarantineReason && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-blocked/30 bg-blocked/10 p-4">
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-blocked" />
          <div>
            <p className="text-sm font-semibold text-blocked">
              Agent QUARANTINED
            </p>
            <p className="text-sm text-muted-foreground">
              {agent.quarantineReason}
            </p>
          </div>
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Trust score"
          value={`${agent.trust}%`}
          icon={ArrowUpRight}
          tone="safe"
        />
        <KpiCard
          label="Risk score"
          value={agent.risk}
          icon={ShieldAlert}
          tone="blocked"
        />
        <KpiCard
          label="Messages sent"
          value={agent.messagesSent}
          icon={ArrowUpRight}
        />
        <KpiCard
          label="Blocked attempts"
          value={agent.blocked ?? 0}
          icon={Ban}
          tone="review"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Panel
          title="Recent activity"
          description="Latest messages sent by this agent">
          {events.length === 0 ? (
            <EmptyState icon={ArrowUpRight} title="No activity yet" />
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {events.map((e) => (
                <div key={e.id} className="flex items-center gap-3 py-3">
                  <ArrowDownRight className="size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">
                      <span className="text-muted-foreground">to</span>{" "}
                      {e.destinationName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {e.content}
                    </p>
                  </div>
                  <span
                    className={cn("text-xs tabular-nums", riskColor(e.risk))}>
                    {e.risk}
                  </span>
                  <DecisionBadge decision={e.decision} />
                </div>
              ))}
            </div>
          )}
        </Panel>

        <div className="flex flex-col gap-6">
          <Panel title="Credentials">
            <div className="flex flex-col gap-3">
              <div>
                <p className="mb-1 text-xs text-muted-foreground">API key</p>
                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-2">
                  <code className="flex-1 truncate font-mono text-xs">
                    {agent.apiKey ?? "Not available"}
                  </code>
                  <button
                    onClick={copyKey}
                    disabled={!agent.apiKey}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Copy API key">
                    {copied ? (
                      <Check className="size-4 text-safe" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                  </button>
                </div>
              </div>
              <Meta
                label="Registered"
                value={mounted ? fmtDateTime(agent.registeredAt) : "—"}
              />
              <Meta
                label="Last seen"
                value={mounted ? fmtDateTime(agent.lastSeen) : "—"}
              />
              <Meta
                label="Strikes"
                value={String(agent.strikes ?? 0)}
              />
            </div>
          </Panel>

          <Panel title="Posture">
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Trust</span>
                <span
                  className={cn(
                    "font-medium tabular-nums",
                    trustColor(agent.trust),
                  )}>
                  {agent.trust}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Risk</span>
                <span
                  className={cn(
                    "font-medium tabular-nums",
                    riskColor(agent.risk),
                  )}>
                  {agent.risk}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Messages received</span>
                <span className="font-medium tabular-nums">
                  {agent.messagesReceived}
                </span>
              </div>
            </div>
          </Panel>
        </div>
      </div>

      <ConfirmDialog
        open={confirm === "quarantine"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Quarantine agent?"
        description={`This immediately disables all send permissions for ${agent.name}.`}
        confirmLabel="Quarantine"
        destructive
        onConfirm={async () => {
          await quarantineAgent(agent.id);
          setAgent((current) =>
            current ? { ...current, status: "QUARANTINED" } : current,
          );
          toast.warning(`${agent.name} quarantined`);
        }}
      />
      <ConfirmDialog
        open={confirm === "delete"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Revoke agent?"
        description={`${agent.name} will be revoked from the gateway.`}
        confirmLabel="Revoke"
        destructive
        onConfirm={async () => {
          await revokeAgent(agent.id);
          toast.success(`${agent.name} revoked`);
          router.push("/admin/agents");
        }}
      />
    </div>
  );
}

function normalizeStatus(status: string): AgentStatus {
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

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
