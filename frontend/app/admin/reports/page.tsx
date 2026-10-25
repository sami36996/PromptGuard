"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Download,
  FileJson,
  FileSpreadsheet,
  ShieldCheck,
  Ban,
  AlertTriangle,
  Search,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

import { useMounted } from "@/lib/promptguard/hooks";
import { getLogs, type PromptLog } from "@/lib/api/logs";
import { getReport, type IncidentReport } from "@/lib/api/report";

import {
  PageHeader,
  Panel,
  KpiCard,
  EmptyState,
  RiskBar,
} from "@/components/promptguard/ui-bits";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { fmtDate, fmtDateTime, riskColor } from "@/lib/promptguard/format";

import { DecisionBadge } from "@/components/promptguard/decision-badge";

import Link from "next/link";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { cn } from "@/lib/api/utils";

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;

  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const mounted = useMounted();

  const [report, setReport] = useState<IncidentReport | null>(null);

  const [logs, setLogs] = useState<PromptLog[]>([]);

  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");

  const [selected, setSelected] = useState<PromptLog | null>(null);

  useEffect(() => {
    async function loadReport() {
      try {
        setLoading(true);

        const [reportData, logsData] = await Promise.all([
          getReport(),
          getLogs(),
        ]);

        setReport(reportData);

        // Depending on your getLogs() implementation,
        // this may already be an array.
        setLogs(logsData);
      } catch (error) {
        console.error("Failed to load reports:", error);

        toast.error("Failed to load report data");
      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, []);

  /*
   * Backend report gives us the official summary.
   */
  const incidents = useMemo(() => {
    return logs
      .filter((log) => log.decision === "BLOCK" || log.decision === "REVIEW")
      .sort((a, b) => {
        const riskA = Number(a.risk_score ?? 0);
        const riskB = Number(b.risk_score ?? 0);

        return riskB - riskA;
      });
  }, [logs]);

  const filtered = useMemo(() => {
    if (!query) return incidents;

    const q = query.toLowerCase();

    return incidents.filter((inc) =>
      JSON.stringify(inc).toLowerCase().includes(q),
    );
  }, [incidents, query]);

  function exportEventsCsv() {
    const header = "id,time,agent,decision,risk,trust\n";

    const rows = logs
      .map((log) =>
        [
          log.id,
          log.created_at,
          log.agent_id,
          log.decision,
          log.risk_score,
          log.trust_score,
        ].join(","),
      )
      .join("\n");

    download("promptguard-events.csv", header + rows, "text/csv");

    toast.success("Events exported");
  }

  function exportJson() {
    if (!report) return;

    const payload = {
      generatedAt: report.generated_at,
      report,
      logs,
    };

    download(
      "promptguard-report.json",
      JSON.stringify(payload, null, 2),
      "application/json",
    );

    toast.success("Report exported");
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Reports & Exports"
          description="Loading PromptGuard security report..."
        />

        <div className="rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
          Loading report data...
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Reports & Exports"
          description="Compliance-ready summaries of gateway activity, security incidents, and audit trails."
        />

        <EmptyState
          icon={AlertCircle}
          title="Unable to load report"
          description="The backend report endpoint did not return any data."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Exports"
        description="Compliance-ready summaries of gateway activity, security incidents, and audit trails."
      />

      {/* Backend Report KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Messages inspected"
          value={report.summary.total_messages}
          icon={ShieldCheck}
          tone="primary"
        />

        <KpiCard
          label="Threats blocked"
          value={report.summary.blocked}
          icon={Ban}
          tone="blocked"
        />

        <KpiCard
          label="Agents QUARANTINED"
          value={report.agents.QUARANTINED}
          icon={AlertTriangle}
          tone="review"
        />

        <KpiCard
          label="Security incidents"
          value={report.summary.blocked + report.summary.review}
          icon={AlertCircle}
          tone="blocked"
        />
      </div>

      {/* Report Summary */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel
          title="System summary"
          description="Current PromptGuard security posture">
          <div className="space-y-3">
            <Stat label="Total agents" value={report.agents.total} />

            <Stat label="ACTIVE agents" value={report.agents.ACTIVE} />

            <Stat label="Average trust" value={`${report.average_trust}%`} />

            <Stat label="Average risk" value={report.average_risk} />

            <Stat
              label="Highest chain risk"
              value={report.highest_chain_risk}
            />
          </div>
        </Panel>

        <Panel
          title="Decision breakdown"
          description="Message inspection results">
          <div className="space-y-4">
            <DecisionRow label="Allowed" value={report.summary.allowed} />

            <DecisionRow label="Review" value={report.summary.review} />

            <DecisionRow label="Blocked" value={report.summary.blocked} />
          </div>
        </Panel>

        <Panel title="Recommendations" description="Generated by PromptGuard">
          {report.recommendations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recommendations.</p>
          ) : (
            <ul className="space-y-3">
              {report.recommendations.map((recommendation, index) => (
                <li
                  key={index}
                  className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
                  {recommendation}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* Incident Log */}
      <Panel
        title="Security incidents"
        description={`${filtered.length} of ${incidents.length} incidents`}
        action={
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search incidents..."
              className="h-8 w-44 pl-8"
            />
          </div>
        }>
        {filtered.length === 0 ? (
          <EmptyState
            icon={AlertCircle}
            title={query ? "No matching incidents" : "No incidents found"}
            description={
              query
                ? "Try a different search term."
                : "No security threats detected."
            }
          />
        ) : (
          <div className="-mx-5 overflow-x-auto">
            <table className="w-full min-w-[850px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-5 py-3">Time</th>

                  <th className="px-5 py-3">Agent</th>

                  <th className="px-5 py-3">Risk</th>

                  <th className="px-5 py-3">Verdict</th>

                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>

              <tbody>
                {filtered.slice(0, 10).map((incident) => (
                  <tr
                    key={incident.id}
                    className="border-b border-border/60 hover:bg-muted/30">
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                      {mounted ? fmtDateTime(incident.created_at) : "—"}
                    </td>

                    <td className="px-5 py-3">{incident.agent_id}</td>

                    <td className="px-5 py-3">
                      <RiskBar value={Number(incident.risk_score ?? 0)} />
                    </td>

                    <td className="px-5 py-3">
                      <DecisionBadge decision={incident.decision} />
                    </td>

                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => setSelected(incident)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                        Details
                        <ExternalLink className="size-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Export */}
      <Panel
        title="Export data"
        description="Download for compliance and analysis">
        <div className="flex flex-col gap-3">
          <button
            onClick={exportEventsCsv}
            className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3 text-left hover:bg-muted/60">
            <FileSpreadsheet className="size-4" />

            <div className="flex-1">
              <p className="text-sm font-medium">Security events CSV</p>

              <p className="text-xs text-muted-foreground">
                {logs.length} rows
              </p>
            </div>

            <Download className="size-4 text-muted-foreground" />
          </button>

          <button
            onClick={exportJson}
            className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3 text-left hover:bg-muted/60">
            <FileJson className="size-4" />

            <div className="flex-1">
              <p className="text-sm font-medium">Full report JSON</p>

              <p className="text-xs text-muted-foreground">
                Summary, agents, and security data
              </p>
            </div>

            <Download className="size-4 text-muted-foreground" />
          </button>

          <p className="mt-1 text-xs text-muted-foreground">
            Report generated {mounted ? fmtDate(report.generated_at) : "—"}.
            Includes {report.agents.total} registered agents and{" "}
            {report.summary.total_messages} inspected messages.
          </p>
        </div>
      </Panel>

      {/* Incident Details */}
      <Dialog
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>Incident Details</DialogTitle>

                <DialogDescription>Security inspection event</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <Stat
                    label="Agent ID"
                    value={selected.agent_id ?? "N/A"}
                  />

                <Stat label="Decision" value={selected.decision} />

                <Stat
                  label="Risk Score"
                  value={Number(selected.risk_score ?? 0)}
                  tone={riskColor(Number(selected.risk_score ?? 0))}
                />

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(String(selected.id));

                      toast.success("Incident ID copied");
                    }}
                    className="w-full">
                    Copy ID
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "text-foreground",
}: {
  label: string;
  value: string | number;
  tone?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>

      <p className={cn("mt-1 text-lg font-semibold tabular-nums", tone)}>
        {value}
      </p>
    </div>
  );
}

function DecisionRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
      <span className="text-sm">{label}</span>

      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
}
