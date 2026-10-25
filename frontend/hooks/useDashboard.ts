"use client";

import { useCallback, useEffect, useState } from "react";
import { getAdminStats, type AdminStats } from "@/lib/api/admin";

export interface DashboardKpis {
  total: number;
  ACTIVEAgents: number;
  QUARANTINED: number;
  messagesToday: number;
  blockedToday: number;
  avgTrust: number;
  avgRisk: number;
  criticalChains: number;
}

export interface DashboardData {
  kpis: DashboardKpis;
}

const defaultKpis: DashboardKpis = {
  total: 0,
  ACTIVEAgents: 0,
  QUARANTINED: 0,
  messagesToday: 0,
  blockedToday: 0,
  avgTrust: 0,
  avgRisk: 0,
  criticalChains: 0,
};

export function useDashboard() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data: AdminStats = await getAdminStats();

      setDashboard({
        kpis: {
          total: data.total_agents,
          ACTIVEAgents: data.active_today,
          QUARANTINED: data.quarantined_agents ?? 0,
          messagesToday: data.total_requests,
          blockedToday: data.total_blocked,
          avgTrust: data.average_trust ?? 0,
          avgRisk: data.average_risk ?? 0,
          criticalChains: data.critical_chains ?? 0,
        },
      });
    } catch (err) {
      console.error("Failed to load admin stats:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load dashboard",
      );

      setDashboard({ kpis: defaultKpis });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    dashboard,
    loading,
    error,
    refresh,
  };
}
