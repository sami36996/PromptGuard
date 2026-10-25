"use client";

import { useEffect, useMemo, useState } from "react";
import { getLogs, type PromptLog } from "@/lib/api/logs";
import { Activity, Search } from "lucide-react";
import {
  PageHeader,
  Panel,
  RiskBar,
  EmptyState,
} from "@/components/promptguard/ui-bits";
import { DecisionBadge } from "@/components/promptguard/decision-badge";
import { fmtDateTime, riskColor } from "@/lib/promptguard/format";
import type { Decision } from "@/lib/promptguard/types";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/api/utils";

const FILTERS: Array<{ label: string; value: Decision | "ALL" }> = [
  { label: "All", value: "ALL" },
  { label: "Allowed", value: "ALLOW" },
  { label: "Review", value: "REVIEW" },
  { label: "Blocked", value: "BLOCK" },
];

export default function EventsPage() {
  const [events, setEvents] = useState<PromptLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Decision | "ALL">("ALL");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<PromptLog | null>(null);

  useEffect(() => {
    async function loadEvents() {
      try {
        const data = await getLogs();
        setEvents(data);
      } catch (error) {
        console.error("Failed to load events:", error);
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, []);

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (filter !== "ALL" && e.decision.toUpperCase() !== filter) {
        return false;
      }

      if (query) {
        const q = query.toLowerCase();

        return (
          e.prompt.toLowerCase().includes(q) ||
          e.decision.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [events, filter, query]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        Loading events...
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Security Events"
        description="Every inspected prompt with the gateway's security verdict."
      />

      <Panel
        title="Event log"
        description={`${filtered.length} of ${events.length} events`}
        action={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="h-8 w-40 pl-8"
              />
            </div>

            <div className="flex rounded-lg border border-border p-0.5">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                    filter === f.value
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        }>
        {filtered.length === 0 ? (
          <EmptyState icon={Activity} title="No matching events" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="pb-2 font-medium">Time</th>
                  <th className="pb-2 font-medium">Event</th>
                  <th className="pb-2 font-medium">Risk</th>
                  <th className="pb-2 font-medium">Verdict</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {filtered.map((e) => (
                  <tr
                    key={e.id}
                    onClick={() => setSelected(e)}
                    className="cursor-pointer transition-colors hover:bg-muted/40">
                    <td className="py-2.5 pr-4 font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {fmtDateTime(e.created_at)}
                    </td>

                    <td className="max-w-md truncate py-2.5 pr-4 font-medium">
                      {e.prompt}
                    </td>

                    <td className="py-2.5 pr-4">
                      <RiskBar value={e.risk_score} />
                    </td>

                    <td className="py-2.5">
                      <DecisionBadge
                        decision={e.decision.toUpperCase() as Decision}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) {
            setSelected(null);
          }
        }}>
        <DialogContent className="max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  Event Detail
                  <DecisionBadge
                    decision={selected.decision.toUpperCase() as Decision}
                  />
                </DialogTitle>

                <DialogDescription>
                  Prompt inspection · {fmtDateTime(selected.created_at)}
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <Stat
                    label="Risk score"
                    value={selected.risk_score}
                    tone={riskColor(selected.risk_score)}
                  />

                  <Stat
                    label="Decision"
                    value={selected.decision.toUpperCase()}
                    tone={riskColor(selected.risk_score)}
                  />
                </div>

                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    Message content
                  </p>

                  <p className="rounded-lg border border-border bg-muted/40 p-3 font-mono text-xs leading-relaxed">
                    {selected.prompt}
                  </p>
                </div>

                <div>
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                    Findings
                  </p>

                  {!selected.findings || selected.findings.length === 0 ? (
                    <p className="text-xs text-safe">
                      No malicious patterns detected.
                    </p>
                  ) : (
                    <div className="rounded-lg border border-blocked/30 bg-blocked/10 p-2.5">
                      <ul className="space-y-1 text-xs text-blocked">
                        {selected.findings.map((finding, index) => (
                          <li key={index}>
                            {typeof finding === "string"
                              ? finding
                              : JSON.stringify(finding)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
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
  tone,
}: {
  label: string;
  value: string | number;
  tone: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>

      <p className={cn("mt-0.5 text-xl font-semibold tabular-nums", tone)}>
        {value}
      </p>
    </div>
  );
}
