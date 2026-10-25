"use client";

import { useEffect, useState } from "react";
import {
  Download,
  FileJson,
  FileText,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

import { useMounted } from "@/lib/promptguard/hooks";
import { useAgents } from "@/hooks/useAgents";
import { getLogs, type PromptLog } from "@/lib/api/logs";

import { Button } from "@/components/ui/button";
import {
  PageHeader,
  Panel,
  KpiCard,
} from "@/components/promptguard/ui-bits";

import { fmtDateTime } from "@/lib/promptguard/format";
import { apiClient } from "@/lib/api/client";

export default function ExportsPage() {
  const mounted = useMounted();

  // Backend agents
  const {
    agents,
    loading: agentsLoading,
  } = useAgents();

  // Backend logs
  const [events, setEvents] = useState<PromptLog[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  const [exporting, setExporting] = useState<
    "agents" | "events-json" | "events-csv" | null
  >(null);

  useEffect(() => {
    async function loadEvents() {
      try {
        const data = await getLogs();
        setEvents(data);
      } catch (error) {
        console.error("Failed to load events:", error);
      } finally {
        setEventsLoading(false);
      }
    }

    loadEvents();
  }, []);

  const downloadFile = async (
    endpoint: string,
    filename: string,
    type: "agents" | "events-json" | "events-csv",
  ) => {
    setExporting(type);

    try {
      const blob = await apiClient.download(endpoint);

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = filename;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

      toast.success(`${filename} downloaded successfully`);
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export file");
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Exports & Reports"
        description="Download your PromptGuard data in JSON or CSV format for analysis and integration."
      />

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          label="Total Agents"
          value={agentsLoading ? "..." : agents.length}
          icon={FileText}
          tone="default"
        />

        <KpiCard
          label="Security Events"
          value={eventsLoading ? "..." : events.length}
          icon={AlertCircle}
          tone="default"
        />

        <KpiCard
          label="Last Export"
          value={mounted ? fmtDateTime(Date.now()) : "—"}
          icon={Download}
          tone="default"
        />
      </div>

      {/* Export Options */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Agents */}
        <Panel
          title="Agents"
          description={
            agentsLoading
              ? "Loading agents..."
              : `Export ${agents.length} registered agents`
          }
        >
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Download all registered agents with their metadata.
            </p>

            <Button
              size="sm"
              variant="outline"
              disabled={exporting === "agents"}
              onClick={() =>
                downloadFile(
                  "/api/export/agents/csv",
                  "agents.csv",
                  "agents",
                )
              }
              className="w-full"
            >
              <FileText className="size-4" />

              {exporting === "agents"
                ? "Exporting..."
                : "Download Agents CSV"}
            </Button>
          </div>
        </Panel>

        {/* Security Events */}
        <Panel
          title="Security Events"
          description={
            eventsLoading
              ? "Loading events..."
              : `Export ${events.length} security events`
          }
        >
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Download all PromptGuard inspection logs and security events.
            </p>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={exporting === "events-csv"}
                onClick={() =>
                  downloadFile(
                    "/api/export/logs/csv",
                    "logs.csv",
                    "events-csv",
                  )
                }
                className="flex-1"
              >
                <FileText className="size-4" />

                {exporting === "events-csv"
                  ? "Exporting..."
                  : "CSV"}
              </Button>

              <Button
                size="sm"
                disabled={exporting === "events-json"}
                onClick={() =>
                  downloadFile(
                    "/api/export/logs/json",
                    "logs.json",
                    "events-json",
                  )
                }
                className="flex-1"
              >
                <FileJson className="size-4" />

                {exporting === "events-json"
                  ? "Exporting..."
                  : "JSON"}
              </Button>
            </div>
          </div>
        </Panel>
      </div>

      {/* Export Information */}
      <Panel
        title="Data Format"
        description="Information about exported files"
      >
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium">
              JSON Format
            </h3>

            <p className="mt-1 text-xs text-muted-foreground">
              Complete log data for programmatic processing and integration.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium">
              CSV Format
            </h3>

            <p className="mt-1 text-xs text-muted-foreground">
              Spreadsheet-compatible data for Excel, Google Sheets, and
              analytics tools.
            </p>
          </div>
        </div>
      </Panel>
    </div>
  );
}