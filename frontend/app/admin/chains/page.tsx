"use client";
import { useEffect, useState } from "react";
import { getChains } from "@/lib/api/chains";
import { getAdminPolicy } from "@/lib/api/admin";
import { Link2, GitBranch, ShieldAlert } from "lucide-react";
import {
  PageHeader,
  Panel,
  RiskBar,
  EmptyState,
} from "@/components/promptguard/ui-bits";
import { DecisionBadge } from "@/components/promptguard/decision-badge";
import { fmtDateTime, riskColor } from "@/lib/promptguard/format";
import type { Chain } from "@/lib/promptguard/types";
import { cn } from "@/lib/api/utils";

export default function ChainsPage() {
  const [selected, setSelected] = useState<Chain | null>(null);
  
  const [chains, setChains] = useState<Chain[]>([]);
  const [loading, setLoading] = useState(true);
  const [maxChainRisk, setMaxChainRisk] = useState(100);
  const critical = chains.filter(
    (c) => c.chainRisk >= maxChainRisk,
  ).length;
  useEffect(() => {
  async function loadChains() {
    try {
      const [data, policy] = await Promise.all([
        getChains(),
        getAdminPolicy(),
      ]);
      setChains(data);
      setMaxChainRisk(policy.max_chain_risk);
    } catch (error) {
      console.error("Failed to load chains:", error);
    } finally {
      setLoading(false);
    }
  }

  loadChains();
}, []);
  return (
    <div>
      <PageHeader
        title="Communication Chains"
        description="Multi-hop agent-to-agent conversations with propagated risk scoring."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <Panel
          title="Recent chains"
          description={`${chains.length} tracked · ${critical} above max chain risk (${maxChainRisk})`}>
          {chains.length === 0 ? (
            <EmptyState
              icon={GitBranch}
              title="No chains yet"
              description="Agent conversations will appear here."
            />
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {chains.map((c) => {
                const isACTIVE = selected?.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelected(c)}
                    className={cn(
                      "flex items-center gap-3 py-3 text-left transition-colors hover:bg-muted/40",
                      isACTIVE && "bg-muted/50",
                    )}>
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Link2 className="size-4 text-muted-foreground" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {c.hops[0]?.from}{" "}
                        <span className="text-muted-foreground">→</span>{" "}
                        {c.hops[c.hops.length - 1]?.to}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {c.hops.length} hop{c.hops.length > 1 ? "s" : ""} ·{" "}
                        {fmtDateTime(c.createdAt)}
                      </p>
                    </div>
                    <RiskBar value={c.chainRisk} />
                    <DecisionBadge decision={c.finalVerdict} />
                  </button>
                );
              })}
            </div>
          )}
        </Panel>

        <Panel title="Chain inspector" description="Hop-by-hop breakdown">
          {!selected ? (
            <EmptyState
              icon={GitBranch}
              title="Select a chain"
              description="Choose a chain to inspect its hops."
            />
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-3">
                <div>
                  <p className="text-xs text-muted-foreground">Chain risk</p>
                  <p
                    className={cn(
                      "text-xl font-semibold tabular-nums",
                      riskColor(selected.chainRisk),
                    )}>
                    {selected.chainRisk}
                  </p>
                </div>
                <DecisionBadge decision={selected.finalVerdict} />
              </div>

              <ol className="relative flex flex-col gap-4 border-l border-border pl-5">
                {selected.hops.map((hop, i) => (
                  <li key={i} className="relative">
                    <span
                      className={cn(
                        "absolute -left-[27px] top-1 size-3 rounded-full ring-4 ring-background",
                        hop.decision === "BLOCK"
                          ? "bg-blocked"
                          : hop.decision === "REVIEW"
                            ? "bg-review"
                            : "bg-safe",
                      )}
                    />
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">
                        {hop.from}{" "}
                        <span className="text-muted-foreground">→</span>{" "}
                        {hop.to}
                      </p>
                      <span
                        className={cn(
                          "text-xs font-medium tabular-nums",
                          riskColor(hop.risk),
                        )}>
                        {hop.risk}
                      </span>
                    </div>
                    {hop.attackTypes.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {hop.attackTypes.map((t) => (
                          <span
                            key={t}
                            className="inline-flex items-center gap-1 rounded-md bg-blocked/15 px-1.5 py-0.5 text-[11px] font-medium text-blocked">
                            <ShieldAlert className="size-3" />
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
