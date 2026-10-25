"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getAdminStats,
  getGlobalAgents,
  getGlobalThreats,
  AdminStats,
  AdminAgent,
  ThreatEvent,
} from "@/lib/api/admin";

export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getAdminStats();
      setStats(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load admin stats"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    stats,
    loading,
    error,
    refresh,
  };
}