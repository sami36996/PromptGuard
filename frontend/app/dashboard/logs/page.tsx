"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Search,
  ShieldAlert,
} from "lucide-react";

import { getLogs, type PromptLog } from "@/lib/api/logs";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

type Filter = "ALL" | "ALLOW" | "REVIEW" | "BLOCK";

export default function LogsPage() {
  const [logs, setLogs] = useState<PromptLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");

  useEffect(() => {
    async function loadLogs() {
      try {
        const data = await getLogs();
        setLogs(data);
      } catch (error) {
        console.error("Failed to load logs:", error);
      } finally {
        setLoading(false);
      }
    }

    loadLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    const query = search.toLowerCase();

    return logs.filter((log) => {
      const matchesFilter =
        filter === "ALL" || log.decision.toUpperCase() === filter;

      const matchesSearch =
        !query ||
        log.prompt.toLowerCase().includes(query) ||
        String(log.agent_id ?? "").toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [logs, search, filter]);

  const allowed = logs.filter(
    (log) => log.decision.toUpperCase() === "ALLOW",
  ).length;

  const review = logs.filter(
    (log) => log.decision.toUpperCase() === "REVIEW",
  ).length;

  const blocked = logs.filter(
    (log) => log.decision.toUpperCase() === "BLOCK",
  ).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Security Logs
        </h1>

        <p className="text-muted-foreground">
          Review prompts, decisions, risk scores, and security findings.
        </p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard
          label="Total Events"
          value={logs.length}
          icon={Activity}
        />

        <SummaryCard
          label="Allowed"
          value={allowed}
          icon={CheckCircle2}
        />

        <SummaryCard
          label="Under Review"
          value={review}
          icon={AlertTriangle}
        />

        <SummaryCard
          label="Blocked"
          value={blocked}
          icon={ShieldAlert}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search prompts or agent IDs..."
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {(["ALL", "ALLOW", "REVIEW", "BLOCK"] as Filter[]).map(
              (option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFilter(option)}
                  className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                    filter === option
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  {option === "ALL" ? "All" : option}
                </button>
              ),
            )}
          </div>
        </CardContent>
      </Card>

      {/* Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-sm text-muted-foreground">
              Loading security logs...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-12 text-center">
              <Activity className="mx-auto mb-4 size-10 text-muted-foreground" />

              <h3 className="font-semibold">
                No security events found
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                Security events will appear here as prompts are processed.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredLogs.map((log) => (
                <LogRow key={log.id} log={log} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function LogRow({ log }: { log: PromptLog }) {
  const decision = log.decision.toUpperCase();

  return (
    <div className="space-y-4 p-6 transition-colors hover:bg-muted/30">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <DecisionBadge decision={decision} />

            <span className="font-mono text-xs text-muted-foreground">
              #{log.id}
            </span>

            <span className="text-xs text-muted-foreground">
              {formatDate(log.created_at)}
            </span>
          </div>

          <p className="line-clamp-3 text-sm">
            {log.prompt}
          </p>

          {log.agent_id && (
            <p className="mt-2 font-mono text-xs text-muted-foreground">
              Agent: {log.agent_id}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-6 text-sm sm:grid-cols-3">
          <Score
            label="Risk"
            value={log.risk_score}
          />

          <Score
            label="Trust"
            value={log.trust_score}
          />

          <div>
            <p className="text-xs text-muted-foreground">
              Findings
            </p>

            <p className="mt-1 font-semibold">
              {log.findings?.length ?? 0}
            </p>
          </div>
        </div>
      </div>

      {log.findings && log.findings.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {log.findings.map((finding, index) => (
            <Badge
              key={`${finding}-${index}`}
              variant="secondary"
            >
              {finding}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function DecisionBadge({
  decision,
}: {
  decision: string;
}) {
  if (decision === "BLOCK") {
    return <Badge variant="destructive">BLOCKED</Badge>;
  }

  if (decision === "REVIEW") {
    return <Badge variant="secondary">REVIEW</Badge>;
  }

  return <Badge>ALLOWED</Badge>;
}

function Score({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 font-semibold">
        {value}
      </p>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
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

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}