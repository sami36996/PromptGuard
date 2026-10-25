"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getGlobalThreats,
} from "@/lib/api/admin";
import type {
  Decision,
  SecurityEvent,
} from "@/lib/promptguard/types";

export function useEvents() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getGlobalThreats();

      setEvents(
        data.map((event) => {
          const decision = severityDecision(event.severity);
          const risk =
            event.confidence <= 1
              ? Math.round(event.confidence * 100)
              : Math.round(event.confidence);

          return {
            id: String(event.id),
            agentId: event.agent_id === null ? "" : String(event.agent_id),
            agentName:
              event.agent_id === null
                ? "Unassigned agent"
                : `Agent ${event.agent_id}`,
            destinationId: "",
            destinationName: "",
            decision,
            risk,
            trust: Math.max(0, 100 - risk),
            content:
              event.prompt_snippet ??
              event.matched_text ??
              event.threat_type,
            chainId:
              event.guard_log_id === null
                ? ""
                : String(event.guard_log_id),
            time: new Date(event.created_at).getTime(),
            findings: [
              {
                category: event.threat_type,
                detail: event.matched_text ?? event.threat_type,
                severity: normalizeSeverity(event.severity),
              },
            ],
          };
        }),
      );
    } catch (err) {
      console.error("Failed to load threats:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load threats",
      );

      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    events,
    loading,
    error,
    refresh,
  };
}

function severityDecision(severity: string): Decision {
  const normalized = severity.toLowerCase();
  if (normalized === "critical" || normalized === "high") return "BLOCK";
  if (normalized === "medium") return "REVIEW";
  return "ALLOW";
}

function normalizeSeverity(
  severity: string,
): "low" | "medium" | "high" | "critical" {
  switch (severity.toLowerCase()) {
    case "critical":
      return "critical";
    case "high":
      return "high";
    case "medium":
      return "medium";
    default:
      return "low";
  }
}
