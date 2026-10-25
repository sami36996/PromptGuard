"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getGlobalAgents,
} from "@/lib/api/admin";
import type { Agent, AgentStatus } from "@/lib/promptguard/types";

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getGlobalAgents();

      setAgents(
        data.map((agent) => ({
          id: agent.agent_id,
          name: agent.agent_name,
          type: agent.agent_type,
          organization: agent.company_name,
          status: normalizeStatus(agent.status),
          trust: agent.trust_score,
          risk: Math.max(0, 100 - agent.trust_score),
          messagesSent: agent.total_messages,
          messagesReceived: 0,
          blocked: agent.blocked_messages,
          createdAt: agent.created_at,
          registeredAt: agent.created_at,
          lastSeen: agent.last_seen,
        })),
      );
    } catch (err) {
      console.error("Failed to load agents:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load agents",
      );

      setAgents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    agents,
    loading,
    error,
    refresh,
  };
}

function normalizeStatus(status: string): AgentStatus {
  switch (status.toUpperCase()) {
    case "ACTIVE":
      return "ACTIVE";
    case "QUARANTINED":
      return "QUARANTINED";
    case "WARNING":
    case "SUSPENDED":
      return "WARNING";
    default:
      return "INACTIVE";
  }
}
